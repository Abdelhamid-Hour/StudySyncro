export const selectedFiles = new DataTransfer();
export const PLAYBACK_RATE = [1, 1.5, 2, 0.5];

export const MAXFILESIZE = 50 * 1024 * 1024; // 50MB

export const FILE_ALLOWED_TYPES = {
  IMAGE: "image/jpeg, image/png, image/gif, image/webp",
  DOCUMENT:
    "application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  TEXT: "text/plain",
  ARCHIVE: "application/zip, application/x-tar, application/x-rar-compressed",
  AUDIO: "audio/mpeg, audio/wav, audio/ogg",
  VIDEO: "video/mp4, video/webm, video/x-msvideo",
};
