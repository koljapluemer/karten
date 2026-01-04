<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import FlashcardRenderer from '@/entities/flashcards/FlashcardRenderer.vue'
import PracticeInstruction from '@/dumb/PracticeInstruction.vue'
import ActionButtonRow from '@/dumb/ActionButtonRow.vue'
import FlashcardForm from '@/features/flashcard-add/FlashcardForm.vue'
import AttachedCardsTable from '../AttachedCardsTable.vue'

const props = defineProps<{
  parentId: string
  instruction: string
  childType: FlashCardDoc['cardType']
}>()

const emit = defineEmits<{
  (event: 'done'): void
  (event: 'edit-card', card: FlashCardDoc): void
}>()

const store = useFlashcardsStore()
const isSaving = ref(false)
const formKey = ref(0)
const addedIds = ref<string[]>([])

const parentCard = computed(() => store.flashcards.find((card) => card._id === props.parentId))

const addedCards = computed(() =>
  addedIds.value
    .map((id) => store.flashcards.find((card) => card._id === id))
    .filter((card): card is FlashCardDoc => Boolean(card))
)

const handleAdd = async (payload: { front: string; back: string }) => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const card = await store.createFlashcard(
      payload.front,
      payload.back,
      props.childType,
      [props.parentId]
    )
    addedIds.value = [card._id, ...addedIds.value]
    formKey.value += 1
  } finally {
    isSaving.value = false
  }
}

const handleDetach = async (card: FlashCardDoc) => {
  const nextRequires = card.requiresLearning.filter((id) => id !== props.parentId)
  await store.updateFlashcard(card._id, { requiresLearning: nextRequires })
  addedIds.value = addedIds.value.filter((id) => id !== card._id)
}

const handleDelete = async (card: FlashCardDoc) => {
  await store.deleteFlashcard(card._id)
  addedIds.value = addedIds.value.filter((id) => id !== card._id)
}
</script>

<template>
  <div class="w-full max-w-4xl space-y-6">
    <PracticeInstruction :text="instruction" />

    <div
      v-if="parentCard"
      class="w-full"
    >
      <FlashcardRenderer
        :front="parentCard.front"
        :back="parentCard.back"
        :card-type="parentCard.cardType"
        :show-back="true"
      />
    </div>

    <AttachedCardsTable
      :items="addedCards"
      show-detach
      @edit="emit('edit-card', $event)"
      @detach="handleDetach"
      @delete="handleDelete"
    />

    <FlashcardForm
      :key="formKey"
      submit-label="Add"
      :card-type="childType"
      :is-saving="isSaving"
      @save="handleAdd"
    />

    <ActionButtonRow
      :actions="[{ id: 'done', label: 'Done', variant: 'primary' }]"
      @select="emit('done')"
    />
  </div>
</template>
