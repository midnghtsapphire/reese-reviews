// ============================================================
// YOUTUBE SERVICE — BARREL EXPORT
// ============================================================

export {
  // OAuth2
  getStoredCredentials,
  saveCredentials,
  getStoredTokens,
  isAuthenticated,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  disconnectYouTube,
  parseCallbackCode,
  // Channel
  getChannelInfo,
  // Metadata
  generateVideoMetadata,
  buildCompliantDescription,
  adjustForShorts,
  YOUTUBE_CATEGORIES,
  // Upload
  uploadVideo,
  uploadThumbnail,
  // Queue
  getUploadQueue,
  addToUploadQueue,
  updateQueueItem,
  removeFromQueue,
  clearCompletedFromQueue,
  processUploadQueue,
} from "./youtubeService";

export type {
  YouTubeCredentials,
  YouTubeTokens,
  YouTubeVideoMetadata,
  YouTubeUploadResult,
  UploadQueueItem,
  ReviewMetadataInput,
} from "./youtubeService";

export { YouTubeManager } from "./YouTubeManager";
