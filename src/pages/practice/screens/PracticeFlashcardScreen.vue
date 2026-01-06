<script setup lang="ts">
import { computed, ref } from 'vue'
import ActionButtonRow from '@/dumb/ActionButtonRow.vue'
import FlashcardPracticePanel from '../tasks/FlashcardPracticePanel.vue'

defineProps<{
  cardId: string
}>()

const emit = defineEmits<{
  (event: 'next'): void
  (event: 'followup'): void
  (event: 'overlap'): void
  (event: 'required'): void
}>()

const lastAnswer = ref<'no' | 'kindof' | 'yes' | 'easily' | null>(null)
type ActionOption = { id: string; label: string; variant?: 'primary' | 'outline' | 'ghost' }

const handleAnswered = (payload: { score: number; label: 'no' | 'kindof' | 'yes' | 'easily' }) => {
  lastAnswer.value = payload.label
}

const postActions = computed<ActionOption[]>(() => {
  if (!lastAnswer.value) return []
  if (lastAnswer.value === 'easily') {
    return [
      { id: 'followup', label: 'Add Follow-Up Flashcard', variant: 'primary' },
      { id: 'next', label: 'Next', variant: 'outline' }
    ]
  }
  if (lastAnswer.value === 'yes') {
    return [
      { id: 'overlap', label: 'Add Overlapping Flashcards', variant: 'primary' },
      { id: 'next', label: 'Next', variant: 'outline' }
    ]
  }
  return [
    { id: 'required', label: 'Add Required Flashcards', variant: 'primary' },
    { id: 'overlap', label: 'Add Overlapping Flashcards', variant: 'outline' },
    { id: 'next', label: 'Next', variant: 'outline' }
  ]
})

const handlePostAction = (id: string) => {
  if (id === 'followup') emit('followup')
  else if (id === 'overlap') emit('overlap')
  else if (id === 'required') emit('required')
  else emit('next')
}
</script>

<template>
  <div class="w-full max-w-4xl space-y-6">
    <FlashcardPracticePanel
      :card-id="cardId"
      @answered="handleAnswered"
    />

    <ActionButtonRow
      v-if="postActions.length"
      :actions="postActions"
      @select="handlePostAction"
    />
  </div>
</template>
