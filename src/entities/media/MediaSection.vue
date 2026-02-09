<script setup lang="ts">
import MediaUploadButton from './MediaUploadButton.vue'
import MediaAttachmentList from './MediaAttachmentList.vue'
import { deleteMedia } from './mediaStore'

const props = defineProps<{
  mediaIds: string[]
  label?: string
}>()

const emit = defineEmits<{
  'update:mediaIds': [value: string[]]
}>()

const handleUploaded = (mediaId: string) => {
  emit('update:mediaIds', [...props.mediaIds, mediaId])
}

const handleRemove = async (mediaId: string) => {
  await deleteMedia(mediaId)
  emit('update:mediaIds', props.mediaIds.filter((id) => id !== mediaId))
}
</script>

<template>
  <fieldset class="fieldset">
    <label
      v-if="props.label"
      class="label"
    >{{ props.label }}</label>
    <div class="flex gap-2 mb-2">
      <MediaUploadButton
        accept="image/*"
        media-type="image"
        @uploaded="handleUploaded"
      />
      <MediaUploadButton
        accept="audio/*"
        media-type="audio"
        @uploaded="handleUploaded"
      />
    </div>
    <MediaAttachmentList
      :media-ids="props.mediaIds"
      @remove="handleRemove"
    />
  </fieldset>
</template>
