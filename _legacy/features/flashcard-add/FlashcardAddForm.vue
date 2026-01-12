<script setup lang="ts">
import { ref } from 'vue'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import FlashcardForm from './FlashcardForm.vue'

const props = defineProps<{
  cardType?: 'declaritive' | 'procedural'
}>()

const emit = defineEmits<{
  (event: 'added', value: FlashCardDoc): void
}>()

const store = useFlashcardsStore()
const isSaving = ref(false)
const formKey = ref(0)

const handleSave = async (payload: { front: string; back: string; instruction: string }) => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const card = await store.createFlashcard(
      payload.front,
      payload.back,
      props.cardType ?? 'declaritive',
      payload.instruction
    )
    formKey.value += 1
    emit('added', card)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-3xl space-y-6">
    <h2 class="text-2xl font-semibold">
      Add Flashcard
    </h2>

    <FlashcardForm
      :key="formKey"
      submit-label="Save & Next"
      :card-type="cardType"
      :is-saving="isSaving"
      @save="handleSave"
    />
  </div>
</template>
