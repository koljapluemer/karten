<script setup lang="ts">
import { ref, computed } from 'vue'
import RelatedFlashcardsManager from './RelatedFlashcardsManager.vue'
import GradualClozeDeletionWizard from './GradualClozeDeletionWizard.vue'
import { showToast } from '@/app/toast/toastStore'

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

const wizardOpen = ref(false)

const openWizard = () => {
  wizardOpen.value = true
}

const handleWizardComplete = (lastCardId: string) => {
  if (!relatedFlashcardsValue.value.includes(lastCardId)) {
    relatedFlashcardsValue.value = [...relatedFlashcardsValue.value, lastCardId]
  }
  emit('blur')
  showToast('Gradual cloze deletion created', 'success')
}
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

    <div class="flex items-center justify-between gap-2">
      <h3 class="font-bold">
        Related Flashcards
      </h3>
      <button
        class="btn btn-sm"
        @click="openWizard"
      >
        Establish gradual cloze deletion
      </button>
    </div>

    <RelatedFlashcardsManager v-model="relatedFlashcardsValue" />

    <GradualClozeDeletionWizard
      v-model:open="wizardOpen"
      :initial-content="contentValue"
      @complete="handleWizardComplete"
    />
  </div>
</template>
