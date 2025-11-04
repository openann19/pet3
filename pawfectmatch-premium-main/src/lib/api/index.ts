/**
 * API Services Index
 * Centralized exports for all API services
 */

export { adoptionAPI } from './adoption-api'
export { lostFoundAPI } from './lost-found-api'
export { communityAPI } from './community-api'
export { liveStreamingAPI } from './live-streaming-api'
export { matchingAPI } from './matching-api'

// Re-export types
export type {
  AdoptionListing,
  AdoptionApplication,
  AdoptionListingFilters,
  CreateAdoptionListingData,
  AdoptionListingStatus,
  AdoptionApplicationStatus
} from '../adoption-marketplace-types'

export type {
  LostAlert,
  Sighting,
  LostAlertFilters,
  CreateLostAlertData,
  CreateSightingData,
  LostAlertStatus
} from '../lost-found-types'

export type {
  Post,
  Comment,
  Reaction,
  CommentReaction,
  PostFilters,
  CreatePostData,
  CreateCommentData,
  ReportData,
  PostKind,
  PostVisibility,
  PostStatus,
  ReactionEmoji
} from '../community-types'

export type {
  LiveStream,
  LiveStreamViewer,
  LiveStreamReaction,
  LiveStreamChatMessage,
  CreateLiveStreamData,
  LiveStreamFilters,
  LiveStreamStatus,
  LiveStreamCategory
} from '../live-streaming-types'

