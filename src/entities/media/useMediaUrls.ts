import { ref, watch, onScopeDispose, type Ref } from 'vue'
import { getMediaByIds } from './mediaStore'

export interface ResolvedMedia {
  id: string
  url: string
  filename: string
  mimeType: string
  mediaType: 'image' | 'audio'
}

export function useMediaUrls(mediaIds: Ref<string[]>) {
  const resolved = ref<ResolvedMedia[]>([])

  const revokeAll = () => {
    for (const item of resolved.value) {
      URL.revokeObjectURL(item.url)
    }
  }

  watch(
    mediaIds,
    async (ids) => {
      revokeAll()

      if (!ids || ids.length === 0) {
        resolved.value = []
        return
      }

      const mediaItems = await getMediaByIds(ids)
      resolved.value = mediaItems.map((m) => ({
        id: m.id,
        url: URL.createObjectURL(m.blob),
        filename: m.filename,
        mimeType: m.mimeType,
        mediaType: m.mediaType
      }))
    },
    { immediate: true }
  )

  onScopeDispose(revokeAll)

  return { resolved }
}
