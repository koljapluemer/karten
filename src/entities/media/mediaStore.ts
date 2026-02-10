import { db } from '@/db/db'
import type { Media, MediaType } from '@/db/Media'

const buildMediaId = (): string => `media:${crypto.randomUUID()}`

export const createMedia = async (
  file: File,
  mediaType: MediaType,
  blob?: Blob
): Promise<Media> => {
  const id = buildMediaId()

  const media: Media = {
    id,
    filename: file.name,
    mimeType: blob?.type ?? file.type,
    mediaType,
    blob: blob ?? file
  }

  await db.media.add(media)
  return media
}

export const createMediaFromBlob = async (
  blob: Blob,
  filename: string,
  mimeType: string,
  mediaType: MediaType
): Promise<Media> => {
  const id = buildMediaId()

  const media: Media = {
    id,
    filename,
    mimeType,
    mediaType,
    blob
  }

  await db.media.add(media)
  return media
}

export const getMediaById = async (id: string): Promise<Media | undefined> => {
  return await db.media.get(id)
}

export const getMediaByIds = async (ids: string[]): Promise<Media[]> => {
  const results = await db.media.bulkGet(ids)
  return results.filter((m): m is Media => m !== undefined)
}

export const deleteMedia = async (id: string): Promise<void> => {
  await db.media.delete(id)
}

export const deleteMediaByIds = async (ids: string[]): Promise<void> => {
  await db.media.bulkDelete(ids)
}
