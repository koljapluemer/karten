<script setup lang="ts">
import { ref } from 'vue'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import PracticeInstruction from '@/dumb/PracticeInstruction.vue'
import FlashcardForm from '@/features/flashcard-add/FlashcardForm.vue'

const props = defineProps<{
  instruction: string
  cardType: FlashCardDoc['cardType']
}>()

const emit = defineEmits<{
  (event: 'done', card: FlashCardDoc): void
  (event: 'add-another', card: FlashCardDoc): void
}>()

const store = useFlashcardsStore()
const isSaving = ref(false)
const formKey = ref(0)

const handleAction = async (event: { id: string; payload: { front: string; back: string } }) => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const card = await store.createFlashcard(
      event.payload.front,
      event.payload.back,
      props.cardType
    )
    formKey.value += 1
    if (event.id === 'done') {
      emit('done', card)
    } else {
      emit('add-another', card)
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-3xl space-y-6">
    <PracticeInstruction :text="instruction" />

    <FlashcardForm
      :key="formKey"
      submit-label="Done"
      :card-type="cardType"
      :is-saving="isSaving"
      :actions="[
        { id: 'done', label: 'Done', variant: 'primary' },
        { id: 'another', label: 'Done and Add Another', variant: 'outline' }
      ]"
      @action="handleAction"
    />
  </div>
</template>
