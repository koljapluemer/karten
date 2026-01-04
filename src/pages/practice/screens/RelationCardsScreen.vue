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
  relation: 'requiresLearning' | 'overlapping'
}>()

const emit = defineEmits<{
  (event: 'done'): void
  (event: 'edit-card', card: FlashCardDoc): void
}>()

const store = useFlashcardsStore()
const isSaving = ref(false)
const formKey = ref(0)
const isAiOpen = ref(false)

const cardsById = computed(() => {
  const map: Record<string, FlashCardDoc> = {}
  store.flashcards.forEach((card) => {
    map[card._id] = card
  })
  return map
})

const parentCard = computed(() => cardsById.value[props.parentId])

const attachedIds = computed(() => {
  const parent = parentCard.value
  if (!parent) return []
  const ids = props.relation === 'requiresLearning' ? parent.requiresLearning : parent.overlapping
  return ids.filter((id) => cardsById.value[id]?.cardType === props.childType)
})

const attachedCards = computed(() =>
  attachedIds.value
    .map((id) => cardsById.value[id])
    .filter((card): card is FlashCardDoc => Boolean(card))
)

const attachToParent = async (cardId: string) => {
  const parent = parentCard.value
  if (!parent) return
  if (props.relation === 'requiresLearning') {
    const next = Array.from(new Set([...parent.requiresLearning, cardId]))
    await store.updateFlashcard(parent._id, { requiresLearning: next })
    return
  }
  await store.addOverlapping(parent._id, cardId)
}

const detachFromParent = async (cardId: string) => {
  const parent = parentCard.value
  if (!parent) return
  if (props.relation === 'requiresLearning') {
    const next = parent.requiresLearning.filter((id) => id !== cardId)
    await store.updateFlashcard(parent._id, { requiresLearning: next })
    return
  }
  await store.removeOverlapping(parent._id, cardId)
}

const handleAdd = async (payload: { front: string; back: string }) => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const card = await store.createFlashcard(payload.front, payload.back, props.childType)
    await attachToParent(card._id)
    formKey.value += 1
  } finally {
    isSaving.value = false
  }
}

const handleDetach = async (card: FlashCardDoc) => {
  await detachFromParent(card._id)
}

const handleDelete = async (card: FlashCardDoc) => {
  if (props.relation === 'requiresLearning') {
    await detachFromParent(card._id)
  }
  await store.deleteFlashcard(card._id)
}

const aiTitle = computed(() => {
  if (props.relation === 'overlapping') {
    return props.childType === 'procedural' ? 'Generate Overlapping Goals' : 'Generate Overlapping Flashcards'
  }
  return props.childType === 'procedural' ? 'Generate Required Goals' : 'Generate Required Flashcards'
})

const aiDescription = computed(() => {
  if (props.relation === 'overlapping') {
    return props.childType === 'procedural'
      ? 'Use AI to suggest overlapping goals for this goal.'
      : 'Use AI to suggest overlapping flashcards for this flashcard.'
  }
  return props.childType === 'procedural'
    ? 'Use AI to suggest prerequisite goals for this goal.'
    : 'Use AI to suggest prerequisite flashcards for this item.'
})

const defaultPrompt = computed(() => {
  const parent = parentCard.value
  const parentLabel = parent?.cardType === 'procedural' ? 'Parent Goal' : 'Parent Flashcard'
  const relationLabel =
    props.relation === 'overlapping'
      ? props.childType === 'procedural'
        ? 'Overlapping Goals'
        : 'Overlapping Flashcards'
      : props.childType === 'procedural'
        ? 'Required Goals'
        : 'Required Flashcards'
  const intro =
    props.relation === 'overlapping'
      ? props.childType === 'procedural'
        ? 'Generate overlapping procedural goals that help achieve this goal.'
        : 'Generate overlapping declarative flashcards that add context to this flashcard.'
      : props.childType === 'procedural'
        ? 'Generate prerequisite procedural goals needed before this goal.'
        : 'Generate prerequisite declarative flashcards needed before this item.'
  const parentLines = parent
    ? [`${parentLabel}:`, `Front: ${parent.front}`, parent.back ? `Back: ${parent.back}` : '']
    : []
  const existingLines = attachedCards.value.length
    ? [`${relationLabel} already added:`, ...attachedCards.value.map((card) => `- ${card.front}`)]
    : []
  return [
    intro,
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
    const created = await store.createFlashcard(front, back, props.childType)
    await attachToParent(created._id)
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
        :show-back="parentCard.cardType === 'declaritive'"
      />
    </div>

    <AttachedCardsTable
      :items="attachedCards"
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
