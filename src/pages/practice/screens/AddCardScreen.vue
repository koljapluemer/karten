<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import PracticeInstruction from '@/dumb/PracticeInstruction.vue'
import FlashcardForm from '@/features/flashcard-add/FlashcardForm.vue'
import GenerateCardsModal from '../GenerateCardsModal.vue'

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
const isAiOpen = ref(false)

const aiTitle = computed(() => (props.cardType === 'procedural' ? 'Generate Goals' : 'Generate Flashcards'))
const aiDescription = computed(() =>
  props.cardType === 'procedural'
    ? 'Use AI to suggest procedural goals.'
    : 'Use AI to suggest declarative flashcards.'
)
const defaultPrompt = computed(() => {
  if (props.cardType === 'procedural') {
    return [
      'You are helping generate procedural learning goals.',
      'Write 3-5 concise goals, each starting with an actionable verb.',
      'Return JSON only.'
    ].join('\n')
  }
  return [
    'You are helping generate declarative flashcards.',
    'Create 3-5 flashcards with clear front/back text.',
    'Return JSON only.'
  ].join('\n')
})

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

const handleAcceptAi = async (cards: { front: string; back?: string }[], generateAgain: boolean) => {
  if (!cards.length) return
  for (const card of cards) {
    const front = card.front?.trim() ?? ''
    const back = props.cardType === 'procedural' ? '' : card.back?.trim() ?? ''
    if (!front || (props.cardType === 'declaritive' && !back)) continue
    await store.createFlashcard(front, back, props.cardType)
  }
  if (!generateAgain) isAiOpen.value = false
}
</script>

<template>
  <div class="w-full max-w-3xl space-y-6">
    <PracticeInstruction :text="instruction" />
    <button
      class="btn btn-outline w-full sm:w-auto"
      @click="isAiOpen = true"
    >
      Generate with AI
    </button>

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

  <GenerateCardsModal
    :open="isAiOpen"
    :title="aiTitle"
    :description="aiDescription"
    :default-prompt="defaultPrompt"
    :card-type="cardType"
    @close="isAiOpen = false"
    @accept="handleAcceptAi"
  />
</template>
