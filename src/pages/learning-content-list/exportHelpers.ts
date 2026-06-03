import JSZip from 'jszip'
import { getMediaByIds } from '@/entities/media/mediaStore'
import type { LearningContent } from '@/db/LearningContent'
import type { Media } from '@/db/Media'

const buildMediaPath = (media: Media): string => {
  const id = media.id.replace(/[^a-zA-Z0-9-]/g, '_')
  return `media/${id}_${media.filename}`
}

export const exportLearningContentAsZip = async (items: LearningContent[]): Promise<void> => {
  const zip = new JSZip()

  const allMediaIds = [...new Set(items.flatMap(item => item.mediaIds ?? []))]
  const mediaList = await getMediaByIds(allMediaIds)
  const mediaById = new Map(mediaList.map(m => [m.id, m]))

  const lines: string[] = []

  for (const item of items) {
    const mediaPaths: string[] = []

    for (const mediaId of item.mediaIds ?? []) {
      const media = mediaById.get(mediaId)
      if (!media) continue
      const path = buildMediaPath(media)
      zip.file(path, media.blob)
      mediaPaths.push(path)
    }

    const record: Record<string, unknown> = { content: item.content }
    if (mediaPaths.length > 0) record.media = mediaPaths
    lines.push(JSON.stringify(record))
  }

  zip.file('content.jsonl', lines.join('\n'))

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'learning-content.zip'
  a.click()
  URL.revokeObjectURL(url)
}
