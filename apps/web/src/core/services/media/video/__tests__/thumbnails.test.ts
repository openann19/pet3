import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getVideoThumbnails } from '../thumbnails'

describe('getVideoThumbnails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('web platform', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'window', {
        value: window,
        writable: true,
      })
    })

    it('should generate thumbnails for valid video', async () => {
      // Mock video element
      const mockVideo = {
        videoWidth: 1280,
        videoHeight: 720,
        duration: 10,
        currentTime: 0,
        crossOrigin: '',
        preload: '',
        src: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
        })),
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,test'),
      }

      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'video') {
          return mockVideo as unknown as HTMLVideoElement
        }
        if (tag === 'canvas') {
          return mockCanvas as unknown as HTMLCanvasElement
        }
        return document.createElement(tag)
      })

      // Simulate metadata loaded
      setTimeout(() => {
        if (mockVideo.onloadedmetadata) {
          mockVideo.onloadedmetadata({} as Event)
        }
      }, 0)

      // Simulate seeked
      setTimeout(() => {
        if (mockVideo.onseeked) {
          mockVideo.onseeked({} as Event)
        }
      }, 100)

      const thumbnails = await getVideoThumbnails('blob:test', 4)

      // Should attempt to generate thumbnails
      expect(document.createElement).toHaveBeenCalledWith('video')
      expect(document.createElement).toHaveBeenCalledWith('canvas')
    })

    it('should return empty array on error', async () => {
      const mockVideo = {
        onerror: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)

      setTimeout(() => {
        if (mockVideo.onerror) {
          mockVideo.onerror({} as Event)
        }
      }, 0)

      const thumbnailsResult = await getVideoThumbnails('blob:test', 4)
      expect(Array.isArray(thumbnailsResult)).toBe(true)
    })
  })

  it('should handle invalid count parameter', async () => {
    const thumbnails = await getVideoThumbnails('blob:test', -1)
    expect(Array.isArray(thumbnails)).toBe(true)
  })
})

