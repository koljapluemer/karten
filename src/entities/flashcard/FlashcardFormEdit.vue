<script setup lang="ts">
import { computed } from 'vue'
import BlockedByManager from './BlockedByManager.vue'
import TagInput from '@/dumb/TagInput.vue'
import type { Tag } from '@/db/Tag'

const props = defineProps<{
  front: string
  back: string
  blockedBy: string[]
  tags: string[]
  allTags: Tag[]
}>()

const emit = defineEmits<{
  'update:front': [value: string]
  'update:back': [value: string]
  'update:blocked-by': [value: string[]]
  'update:tags': [value: string[]]
  'create-tag': [content: string]
}>()

const frontValue = computed({
  get: () => props.front,
  set: (value: string) => emit('update:front', value)
})

const backValue = computed({
  get: () => props.back,
  set: (value: string) => emit('update:back', value)
})

const blockedByValue = computed({
  get: () => props.blockedBy ?? [],
  set: (value: string[]) => emit('update:blocked-by', value)
})

const tagsValue = computed({
  get: () => props.tags ?? [],
  set: (value: string[]) => emit('update:tags', value)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <fieldset class="fieldset">
      <label
        for="front"
        class="label"
      >Front</label>
      <textarea
        id="front"
        v-model="frontValue"
        name="front"
        class="textarea"
        rows="6"
      />
    </fieldset>

    <fieldset class="fieldset">
      <label
        for="back"
        class="label"
      >Back</label>
      <textarea
        id="back"
        v-model="backValue"
        name="back"
        class="textarea"
        rows="6"
      />
    </fieldset>

    <BlockedByManager v-model="blockedByValue" />

    <fieldset class="fieldset">
      <label class="label">Tags</label>
      <TagInput
        v-model="tagsValue"
        :all-tags="allTags"
        @create-tag="(content) => emit('create-tag', content)"
      />
    </fieldset>
  </div>
</template>
