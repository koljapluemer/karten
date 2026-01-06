<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import FlashcardRenderer from '@/entities/flashcards/FlashcardRenderer.vue'
import PracticeInstruction from '@/dumb/PracticeInstruction.vue'
import ActionButtonRow from '@/dumb/ActionButtonRow.vue'
import FlashcardForm from '@/features/flashcard-add/FlashcardForm.vue'
import AttachedCardsTable from '../AttachedCardsTable.vue'
import GenerateCardsModal from '../GenerateCardsModal.vue'

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
const isAiOpen = ref(false)

const parentCard = computed(() => store.flashcards.find((card) => card._id === props.parentId))

const existingChildren = computed(() =>
  store.flashcards.filter(
    (card) =>
      card.cardType === props.childType && card.requiresLearning.includes(props.parentId)
  )
)

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

const logEvent = computed(() =>
  props.childType === 'procedural' ? 'ADDED_FOLLOWUP_GOALS' : 'ADDED_FOLLOWUP_FLASHCARDS'
)

const handleDone = async () => {
  await store.addLog(props.parentId, logEvent.value)
  emit('done')
}

const aiTitle = computed(() =>
  props.childType === 'procedural' ? 'Generate Follow-Up Goals' : 'Generate Follow-Up Flashcards'
)
const aiDescription = computed(() =>
  props.childType === 'procedural'
    ? 'Use AI to suggest follow-up goals for this goal.'
    : 'Use AI to suggest follow-up flashcards for this flashcard.'
)
const defaultPrompt = computed(() => {
  const parent = parentCard.value
  const header =
    props.childType === 'procedural'
      ? 'Generate follow-up procedural goals for this parent goal.'
      : 'Generate follow-up declarative flashcards based on this parent flashcard.'
  const parentLabel = parent?.cardType === 'procedural' ? 'Parent Goal' : 'Parent Flashcard'
  const parentLines = parent
    ? [`${parentLabel}:`, `Front: ${parent.front}`, parent.back ? `Back: ${parent.back}` : '']
    : []
  const existingLabel =
    props.childType === 'procedural' ? 'Existing Follow-Up Goals:' : 'Existing Follow-Up Flashcards:'
  const existingLines = existingChildren.value.length
    ? [existingLabel, ...existingChildren.value.map((card) => `- ${card.front}`)]
    : []
  return [
    header,
    ...parentLines,
    ...existingLines,
    '',
    'Generate 3-5 new items.',
    'Return JSON only.'
  ]
    .filter((line) => line !== '')
    .join('\n')
})

const handleAcceptAi = async (cards: { front: string; back?: string }[], generateAgain: boolean) => {
  if (!cards.length) return
  for (const card of cards) {
    const front = card.front?.trim() ?? ''
    const back = props.childType === 'procedural' ? '' : card.back?.trim() ?? ''
    if (!front || (props.childType === 'declaritive' && !back)) continue
    const created = await store.createFlashcard(front, back, props.childType, [props.parentId])
    addedIds.value = [created._id, ...addedIds.value]
  }
  if (!generateAgain) isAiOpen.value = false
}
</script>

<template>
  <div class="w-full max-w-4xl space-y-6">
    <PracticeInstruction :text="instruction" />
    <button
      class="btn btn-outline w-full sm:w-auto"
      @click="isAiOpen = true"
    >
      Generate with AI
    </button>

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
      @select="handleDone"
    />
  </div>

  <GenerateCardsModal
    :open="isAiOpen"
    :title="aiTitle"
    :description="aiDescription"
    :default-prompt="defaultPrompt"
    :card-type="childType"
    @close="isAiOpen = false"
    @accept="handleAcceptAi"
  />
</template>
