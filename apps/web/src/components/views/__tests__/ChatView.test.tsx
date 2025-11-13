import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatView from '../ChatView'
import type { ChatRoom, Match, Pet } from '@/lib/types'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    useSharedValue: vi.fn((initial: number) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withTiming: vi.fn((v) => v),
    withRepeat: vi.fn((v) => v),
    withSequence: vi.fn((v) => v),
  },
  useSharedValue: vi.fn((initial: number) => ({ value: initial })),
  useAnimatedStyle: vi.fn(() => ({})),
  withTiming: vi.fn((v) => v),
  withRepeat: vi.fn((v) => v),
  withSequence: vi.fn((v) => v),
}))

vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="animated-view" {...props}>{children}</div>
  )
}))

vi.mock('@/effects/reanimated/use-page-transition', () => ({
  usePageTransition: vi.fn(() => ({
    style: {}
  }))
}))

vi.mock('@/effects/reanimated/transitions', () => ({
  timingConfigs: {
    smooth: {},
    fast: {}
  }
}))

// Mock hooks
vi.mock('@/hooks/useStorage', () => ({
  useStorage: vi.fn((key: string, defaultValue: unknown) => {
    const storage: Record<string, unknown> = {
      'matches': [],
      'all-pets': [],
      'user-pets': [],
      'chat-rooms': []
    }
    const setValue = vi.fn()
    return [storage[key] ?? defaultValue, setValue]
  })
}))

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false)
}))

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({
    t: {
      chat: {
        title: 'Chat',
        empty: 'No chats yet'
      }
    }
  }))
}))

vi.mock('@/lib/chat-service', () => ({
  getRoomMessages: vi.fn(() => Promise.resolve({ messages: [] }))
})))

vi.mock('@/lib/chat-utils', () => ({
  createChatRoom: vi.fn((matchId, petId1, petId2, name1, name2, photo1, photo2) => ({
    id: `room-${matchId}`,
    matchId,
    petIds: [petId1, petId2],
    names: [name1, name2],
    photos: [photo1, photo2],
    lastMessage: undefined,
    unreadCount: 0,
    updatedAt: new Date().toISOString()
  }))
}))

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }))
}))

// Mock components
vi.mock('@/components/ChatRoomsList', () => ({
  default: ({ rooms, onSelectRoom }: { rooms: ChatRoom[]; onSelectRoom: (room: ChatRoom) => void }) => (
    <div data-testid="chat-rooms-list">
      {rooms.map(room => (
        <button key={room.id} onClick={() => onSelectRoom(room)} data-testid={`room-${room.id}`}>
          {room.names?.join(' & ')}
        </button>
      ))}
    </div>
  )
}))

vi.mock('@/components/ChatWindowNew', () => ({
  default: ({ room }: { room: ChatRoom | null }) => 
    room ? (
      <div data-testid="chat-window">
        <div>Chat with {room.names?.join(' & ')}</div>
      </div>
    ) : null
}))

const mockUserPet: Pet = {
  id: 'user1',
  name: 'Fluffy',
  species: 'dog',
  breed: 'Golden Retriever',
  age: 3,
  size: 'large',
  photo: 'https://example.com/fluffy.jpg'
}

const mockMatchedPet: Pet = {
  id: 'pet1',
  name: 'Buddy',
  species: 'dog',
  breed: 'Labrador',
  age: 2,
  size: 'large',
  photo: 'https://example.com/buddy.jpg'
}

const mockMatch: Match = {
  id: 'match1',
  petId: 'user1',
  matchedPetId: 'pet1',
  matchedAt: new Date().toISOString(),
  status: 'active'
}

const mockChatRoom: ChatRoom = {
  id: 'room-match1',
  matchId: 'match1',
  petIds: ['user1', 'pet1'],
  names: ['Fluffy', 'Buddy'],
  photos: ['https://example.com/fluffy.jpg', 'https://example.com/buddy.jpg'],
  lastMessage: undefined,
  unreadCount: 0,
  updatedAt: new Date().toISOString()
}

describe('ChatView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render chat view', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()]) // matches
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()]) // all-pets
      vi.mocked(useStorage).mockReturnValueOnce([[mockUserPet], vi.fn()]) // user-pets
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()]) // chat-rooms

      render(<ChatView />)

      await waitFor(() => {
        expect(screen.getByTestId('chat-rooms-list')).toBeInTheDocument()
      })
    })

    it('should show empty state when no user pet', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])

      render(<ChatView />)

      await waitFor(() => {
        expect(screen.getByTestId('animated-view')).toBeInTheDocument()
      })
    })
  })

  describe('Chat Rooms', () => {
    it('should display chat rooms list', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([], vi.fn())
      vi.mocked(useStorage).mockReturnValueOnce([[mockUserPet], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[mockChatRoom], vi.fn()])

      render(<ChatView />)

      await waitFor(() => {
        expect(screen.getByTestId('chat-rooms-list')).toBeInTheDocument()
        expect(screen.getByTestId('room-room-match1')).toBeInTheDocument()
      })
    })

    it('should create chat rooms from matches', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      const setChatRooms = vi.fn()
      vi.mocked(useStorage).mockReturnValueOnce([[mockMatch], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[mockMatchedPet], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[mockUserPet], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], setChatRooms])

      render(<ChatView />)

      await waitFor(() => {
        expect(setChatRooms).toHaveBeenCalled()
      })
    })
  })

  describe('Room Selection', () => {
    it('should select room when clicked', async () => {
      const user = userEvent.setup()
      const { useStorage } = await import('@/hooks/useStorage')
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[mockUserPet], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[mockChatRoom], vi.fn()])

      render(<ChatView />)

      await waitFor(() => {
        expect(screen.getByTestId('room-room-match1')).toBeInTheDocument()
      })

      const roomButton = screen.getByTestId('room-room-match1')
      await user.click(roomButton)

      await waitFor(() => {
        expect(screen.getByTestId('chat-window')).toBeInTheDocument()
      })
    })
  })

  describe('Message Loading', () => {
    it('should load messages for rooms', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      const { getRoomMessages } = await import('@/lib/chat-service')
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[mockUserPet], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[mockChatRoom], vi.fn()])

      render(<ChatView />)

      await waitFor(() => {
        expect(getRoomMessages).toHaveBeenCalled()
      })
    })
  })
})

