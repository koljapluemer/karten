<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { loadFlashcards } from '@/entities/flashcard/flashcardStore'
import {
  loadLearningProgress,
  initializeNewCard,
  updateCardProgress
} from '@/entities/learning-progress/LearningProgressStore'
import type { FlashCardDoc } from '@/entities/flashcard/Flashcard'
import type { LearningProgressDoc } from '@/entities/learning-progress/LearningProgress'
import type { Rating } from 'ts-fsrs'
import PracticeMemorizeFlow from './PracticeMemorizeFlow.vue'
import PracticeRevealFlow from './PracticeRevealFlow.vue'

const flashcards = ref<FlashCardDoc[]>([])
const progressMap = ref<Map<string, LearningProgressDoc>>(new Map())
const currentCard = ref<FlashCardDoc | null>(null)
const previousCardId = ref<string | null>(null)
const isLoading = ref(true)

const isCurrentCardNew = computed(() =>
  currentCard.value ? !progressMap.value.has(currentCard.value.id) : false
)

async function loadData() {
  const [cards, progressDocs] = await Promise.all([
    loadFlashcards(),
    loadLearningProgress()
  ])

  flashcards.value = cards

  const map = new Map<string, LearningProgressDoc>()
  progressDocs.forEach((p) => {
    const flashcardId = p.id.replace('learning-progress:', 'flashcard:')
    map.set(flashcardId, p)
  })
  progressMap.value = map
}

function isCardEligible(card: FlashCardDoc): boolean {
  for (const blockedId of card.blockedBy) {
    const blockedProgress = progressMap.value.get(blockedId)

    if (!blockedProgress) return false

    const blockedDue = new Date(blockedProgress.due)
    if (blockedDue <= new Date()) return false
  }

  return true
}

function selectNextCard(): FlashCardDoc | null {
  const eligible = flashcards.value.filter(isCardEligible)

  if (eligible.length === 0) return null

  // Exclude previous card to prevent repeats
  const eligibleExcludingPrevious = eligible.filter((c) => c.id !== previousCardId.value)

  // If all eligible cards were filtered out (only 1 eligible card which is previous), use eligible
  const pool = eligibleExcludingPrevious.length > 0 ? eligibleExcludingPrevious : eligible

  const unseen = pool.filter((c) => !progressMap.value.has(c.id))
  const due = pool.filter((c) => {
    const progress = progressMap.value.get(c.id)
    return progress && new Date(progress.due) <= new Date()
  })

  const preferUnseen = Math.random() < 0.1

  let nextCard: FlashCardDoc | null = null
  if (preferUnseen && unseen.length > 0) {
    nextCard = unseen[Math.floor(Math.random() * unseen.length)]!
  } else if (due.length > 0) {
    nextCard = due[Math.floor(Math.random() * due.length)]!
  } else if (unseen.length > 0) {
    nextCard = unseen[Math.floor(Math.random() * unseen.length)]!
  }

  return nextCard
}

async function handleNewCardComplete() {
  if (!currentCard.value) return

  const completedCardId = currentCard.value.id
  await initializeNewCard(completedCardId)
  await loadData()
  previousCardId.value = completedCardId
  currentCard.value = selectNextCard()
}

async function handleKnownCardComplete(rating: Rating) {
  if (!currentCard.value) return

  const completedCardId = currentCard.value.id
  await updateCardProgress(completedCardId, rating)
  await loadData()
  previousCardId.value = completedCardId
  currentCard.value = selectNextCard()
}

onMounted(async () => {
  await loadData()
  currentCard.value = selectNextCard()
  isLoading.value = false
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Practice
    </h1>

    <div v-if="isLoading">
      Loading...
    </div>

    <div v-else-if="!currentCard">
      No cards available to practice right now.
    </div>

    <PracticeMemorizeFlow
      v-else-if="isCurrentCardNew"
      :card="currentCard"
      @complete="handleNewCardComplete"
    />

    <PracticeRevealFlow
      v-else
      :card="currentCard"
      @complete="handleKnownCardComplete"
    />
  </div>
</template>
