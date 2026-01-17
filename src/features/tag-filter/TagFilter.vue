<script setup lang="ts">
import { computed } from 'vue'
import TagInput from '@/dumb/TagInput.vue'
import type { Tag } from '@/db/Tag'

export type TagFilterMode = 'any' | 'all' | 'excludes'

const props = defineProps<{
  selectedTags: string[]
  allTags: Tag[]
  mode: TagFilterMode
}>()

const emit = defineEmits<{
  'update:selectedTags': [value: string[]]
  'update:mode': [value: TagFilterMode]
}>()

const selectedTagsValue = computed({
  get: () => props.selectedTags,
  set: (value: string[]) => emit('update:selectedTags', value)
})

const modeValue = computed({
  get: () => props.mode,
  set: (value: TagFilterMode) => emit('update:mode', value)
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex gap-1">
      <button
        class="btn btn-xs"
        :class="{ 'btn-active': modeValue === 'any' }"
        @click="modeValue = 'any'"
      >
        Contains any
      </button>
      <button
        class="btn btn-xs"
        :class="{ 'btn-active': modeValue === 'all' }"
        @click="modeValue = 'all'"
      >
        Contains all
      </button>
      <button
        class="btn btn-xs"
        :class="{ 'btn-active': modeValue === 'excludes' }"
        @click="modeValue = 'excludes'"
      >
        Excludes
      </button>
    </div>
    <TagInput
      v-model="selectedTagsValue"
      :all-tags="allTags"
      placeholder="Filter by tags..."
    />
  </div>
</template>
