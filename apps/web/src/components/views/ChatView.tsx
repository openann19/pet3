import ChatRoomsList from '@/components/ChatRoomsList'
import ChatWindow from '@/components/ChatWindowNew'
import { useApp } from '@/contexts/AppContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { useStorage } from '@/hooks/useStorage'
import { getRoomMessages } from '@/lib/chat-service'
import type { ChatRoom } from '@/lib/chat-types'
import { createChatRoom } from '@/lib/chat-utils'
import { createLogger } from '@/lib/logger'
import type { Match, Pet } from '@/lib/types'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const logger = createLogger('ChatView')

export default function ChatView() {
  const { t } = useApp()
  const [matches] = useStorage<Match[]>('matches', [])
  const [allPets] = useStorage<Pet[]>('all-pets', [])
  const [userPets] = useStorage<Pet[]>('user-pets', [])
  const [chatRooms, setChatRooms] = useStorage<ChatRoom[]>('chat-rooms', [])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useIsMobile()

  const userPet = Array.isArray(userPets) && userPets.length > 0 ? userPets[0] : undefined

  useEffect(() => {
    if (userPets !== undefined && chatRooms !== undefined) {
      setIsLoading(false)
    }
  }, [userPets, chatRooms])

  useEffect(() => {
    if (!userPet || !Array.isArray(matches)) return

    const activeMatches = matches.filter(m => m.status === 'active')
    const existingRoomIds = new Set(Array.isArray(chatRooms) ? chatRooms.map(r => r.matchId) : [])
    
    const newRooms: ChatRoom[] = []
    
    activeMatches.forEach(match => {
      if (!existingRoomIds.has(match.id)) {
        const matchedPet = Array.isArray(allPets) ? allPets.find(p => p.id === match.matchedPetId) : undefined
        if (matchedPet && userPet) {
          newRooms.push(
            createChatRoom(
              match.id,
              match.petId,
              match.matchedPetId,
              userPet.name,
              matchedPet.name,
              userPet.photo,
              matchedPet.photo
            )
          )
        }
      }
    })

    if (newRooms.length > 0) {
      setChatRooms((current) => Array.isArray(current) ? [...current, ...newRooms] : newRooms)
    }
  }, [matches, userPet, allPets])

  useEffect(() => {
    const updateRoomsWithLastMessages = async () => {
      if (!Array.isArray(chatRooms)) return

      const updatedRooms = await Promise.all(
        chatRooms.map(async (room) => {
          try {
            const result = await getRoomMessages(room.id)
            const messages = result.messages
            if (Array.isArray(messages) && messages.length > 0) {
              const lastMessage = messages[messages.length - 1]
              const unreadCount = messages.filter(
                m => m.status !== 'read' && m.senderId !== userPet?.id
              ).length

              return {
                ...room,
                ...(lastMessage && { lastMessage }),
                ...(unreadCount !== undefined && { unreadCount }),
                updatedAt: lastMessage?.timestamp ?? room.updatedAt
              }
            }
          } catch (error) {
            logger.error('Error loading messages', error instanceof Error ? error : new Error(String(error)))
          }
          return room
        })
      )

      setChatRooms(() => {
        const sorted = updatedRooms.sort((a, b) => {
          const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
          const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
          return bTime - aTime
        })
        return sorted
      })
    }

    updateRoomsWithLastMessages()
  }, [selectedRoom])

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room)
  }

  const handleBack = () => {
    setSelectedRoom(null)
  }

  if (isLoading) {
    return null
  }

  if (!userPet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong p-8 rounded-3xl max-w-md"
        >
          <h2 className="text-2xl font-bold mb-2">{t.chat.createProfile}</h2>
          <p className="text-muted-foreground">
            {t.chat.createProfileDesc}
          </p>
        </motion.div>
      </div>
    )
  }

  const showChatWindow = selectedRoom && (!isMobile || selectedRoom)
  const showRoomsList = !isMobile || !selectedRoom

  return (
    <div className="h-[calc(100vh-8rem)]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold mb-2">{t.chat.title}</h2>
        <p className="text-muted-foreground">
          {(chatRooms || []).length} {(chatRooms || []).length === 1 ? t.chat.subtitle : t.chat.subtitlePlural}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100%-5rem)]">
        <AnimatePresence mode="wait">
          {showRoomsList && (
            <motion.div
              key="rooms-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="md:col-span-4 glass-strong rounded-3xl p-4 shadow-xl backdrop-blur-2xl border border-white/20 overflow-hidden"
            >
              <ChatRoomsList
                rooms={chatRooms || []}
                onSelectRoom={handleSelectRoom}
                {...(selectedRoom?.id && { selectedRoomId: selectedRoom.id })}
              />
            </motion.div>
          )}

          {showChatWindow && selectedRoom && (
            <motion.div
              key="chat-window"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`${
                isMobile ? 'col-span-1' : 'md:col-span-8'
              } glass-strong rounded-3xl shadow-xl backdrop-blur-2xl border border-white/20 overflow-hidden flex flex-col`}
            >
              <ChatWindow
                room={selectedRoom}
                currentUserId={userPet.id}
                currentUserName={userPet.name}
                currentUserAvatar={userPet.photo}
                {...(isMobile && { onBack: handleBack })}
              />
            </motion.div>
          )}

          {!selectedRoom && !isMobile && (
            <motion.div
              key="empty-chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="md:col-span-8 glass-effect rounded-3xl flex items-center justify-center border border-white/20"
            >
              <div className="text-center px-4">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  💬
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">{t.chat.selectConversation}</h3>
                <p className="text-muted-foreground">
                  {t.chat.selectConversationDesc}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
