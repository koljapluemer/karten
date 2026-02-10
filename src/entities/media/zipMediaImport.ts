import JSZip from 'jszip'
import { processImage } from './imageCompression'
import { createMediaFromBlob } from './mediaStore'
import type { MediaType } from '@/db/Media'

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm']
const MAX_AUDIO_SIZE = 10 * 1024 * 1024 // 10MB

const getExtension = (filename: string): string => {
  const dotIndex = filename.lastIndexOf('.')
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : ''
}

const getMimeType = (ext: string): string => {
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.webm': 'audio/webm'
  }
  return mimeTypes[ext] ?? 'application/octet-stream'
}

const getMediaType = (ext: string): MediaType | null => {
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio'
  return null
}

export const extractMediaFromZip = async (
  zip: JSZip,
  mediaPaths: string[]
): Promise<Map<string, string>> => {
  const uniquePaths = [...new Set(mediaPaths)]
  const pathToMediaId = new Map<string, string>()

  for (const path of uniquePaths) {
    const entry = zip.file(path)
    if (!entry) {
      console.warn(`Media file not found in ZIP: ${path}`)
      continue
    }

    const filename = path.split('/').pop() || path
    const ext = getExtension(filename)
    const mediaType = getMediaType(ext)

    if (!mediaType) {
      console.warn(`Unsupported media type for: ${path}`)
      continue
    }

    const blob = await entry.async('blob')

    if (mediaType === 'image') {
      const mimeType = getMimeType(ext)
      const file = new File([blob], filename, { type: mimeType })
      const processed = await processImage(file)
      const media = await createMediaFromBlob(processed, filename, processed.type, 'image')
      pathToMediaId.set(path, media.id)
    } else {
      if (blob.size > MAX_AUDIO_SIZE) {
        console.warn(`Audio file too large (>${MAX_AUDIO_SIZE / 1024 / 1024}MB), skipping: ${path}`)
        continue
      }
      const mimeType = getMimeType(ext)
      const media = await createMediaFromBlob(blob, filename, mimeType, 'audio')
      pathToMediaId.set(path, media.id)
    }
  }

  return pathToMediaId
}
