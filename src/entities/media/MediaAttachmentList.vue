<script setup lang="ts">
import { computed } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import { useMediaUrls } from './useMediaUrls'
import { toRef } from 'vue'

const props = defineProps<{
  mediaIds: string[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  remove: [mediaId: string]
}>()

const idsRef = toRef(props, 'mediaIds')
const { resolved } = useMediaUrls(idsRef)

const images = computed(() => resolved.value.filter((m) => m.mediaType === 'image'))
const audios = computed(() => resolved.value.filter((m) => m.mediaType === 'audio'))
</script>

<template>
  <div
    v-if="resolved.length > 0"
    class="flex flex-col gap-2"
  >
    <div
      v-if="images.length > 0"
      class="grid grid-cols-2 sm:grid-cols-3 gap-2"
    >
      <div
        v-for="item in images"
        :key="item.id"
        class="relative group"
      >
        <img
          :src="item.url"
          :alt="item.filename"
          class="rounded max-h-48 w-full object-cover"
        >
        <button
          v-if="!props.readonly"
          class="btn btn-xs btn-circle btn-error absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
          type="button"
          @click="emit('remove', item.id)"
        >
          <Trash2 :size="12" />
        </button>
      </div>
    </div>

    <div
      v-if="audios.length > 0"
      class="flex flex-col gap-2"
    >
      <div
        v-for="item in audios"
        :key="item.id"
        class="flex items-center gap-2"
      >
        <audio
          controls
          :src="item.url"
          class="flex-1"
        />
        <button
          v-if="!props.readonly"
          class="btn btn-xs btn-circle btn-error opacity-0 hover:opacity-100 transition-opacity"
          type="button"
          @click="emit('remove', item.id)"
        >
          <Trash2 :size="12" />
        </button>
      </div>
    </div>
  </div>
</template>
