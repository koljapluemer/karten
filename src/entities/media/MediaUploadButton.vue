<script setup lang="ts">
import { ref } from 'vue'
import { Upload } from 'lucide-vue-next'
import { processImage } from './imageCompression'
import { createMedia } from './mediaStore'
import { showToast } from '@/app/toast/toastStore'
import type { MediaType } from '@/db/Media'

const MAX_AUDIO_SIZE = 10 * 1024 * 1024 // 10MB

const props = defineProps<{
  accept: string
  mediaType: MediaType
  label?: string
}>()

const emit = defineEmits<{
  uploaded: [mediaId: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)

const openPicker = () => {
  fileInput.value?.click()
}

const handleFiles = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files) return

  for (const file of Array.from(files)) {
    if (props.mediaType === 'audio' && file.size > MAX_AUDIO_SIZE) {
      showToast(`${file.name} exceeds 10MB limit`, 'error')
      continue
    }

    let blob: Blob | undefined
    if (props.mediaType === 'image') {
      blob = await processImage(file)
    }

    const media = await createMedia(file, props.mediaType, blob)
    emit('uploaded', media.id)
  }

  // Reset input so the same file can be selected again
  input.value = ''
}
</script>

<template>
  <input
    ref="fileInput"
    type="file"
    :accept="props.accept"
    multiple
    class="hidden"
    @change="handleFiles"
  >
  <button
    class="btn btn-sm btn-outline"
    type="button"
    @click="openPicker"
  >
    <Upload :size="16" />
    {{ props.label ?? (props.mediaType === 'image' ? 'Add Images' : 'Add Audio') }}
  </button>
</template>
