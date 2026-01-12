<script setup lang="ts">
import { computed } from 'vue'
import RelatedFlashcardsManager from './RelatedFlashcardsManager.vue'

const props = defineProps<{
  content: string
  relatedFlashcards: string[]
}>()

const emit = defineEmits<{
  'update:content': [value: string]
  'update:related-flashcards': [value: string[]]
  blur: []
}>()

const contentValue = computed({
  get: () => props.content,
  set: (value: string) => emit('update:content', value)
})

const relatedFlashcardsValue = computed({
  get: () => props.relatedFlashcards ?? [],
  set: (value: string[]) => emit('update:related-flashcards', value)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <fieldset class="fieldset">
      <label
        for="learning-content"
        class="label"
      >Learning Content</label>
      <textarea
        id="learning-content"
        v-model="contentValue"
        name="learning-content"
        class="textarea"
        rows="10"
        @blur="emit('blur')"
      />
    </fieldset>

    <RelatedFlashcardsManager v-model="relatedFlashcardsValue" />
  </div>
</template>
