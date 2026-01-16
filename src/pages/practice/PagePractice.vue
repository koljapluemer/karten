<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Pencil } from 'lucide-vue-next'
import { loadFlashcards } from '@/entities/flashcard/flashcardStore'
import {
  loadLearningProgress,
  initializeNewCard,
  updateCardProgress
} from '@/entities/learning-progress/LearningProgressStore'
import { incrementReviewCountForToday } from '@/entities/review-count/reviewCountStore'
import type { FlashCardDoc } from '@/db/Flashcard'
import type { LearningProgressDoc } from '@/db/LearningProgress'
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

  const pickRandom = (items: FlashCardDoc[]): FlashCardDoc | null => {
    if (items.length === 0) return null
    return items[Math.floor(Math.random() * items.length)] ?? null
  }

  let nextCard: FlashCardDoc | null = null
  if (preferUnseen && unseen.length > 0) {
    nextCard = pickRandom(unseen)
  } else if (due.length > 0) {
    nextCard = pickRandom(due)
  } else if (unseen.length > 0) {
    nextCard = pickRandom(unseen)
  }

  return nextCard
}

async function handleNewCardComplete() {
  if (!currentCard.value) return

  const completedCardId = currentCard.value.id
  await initializeNewCard(completedCardId)
  await incrementReviewCountForToday()
  await loadData()
  previousCardId.value = completedCardId
  currentCard.value = selectNextCard()
}

async function handleKnownCardComplete(rating: Rating) {
  if (!currentCard.value) return

  const completedCardId = currentCard.value.id
  await updateCardProgress(completedCardId, rating)
  await incrementReviewCountForToday()
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
    <div
      v-if="currentCard"
      class="flex justify-end mb-4"
    >
      <router-link
        :to="`/flashcards/${currentCard.id}/edit?returnTo=/practice`"
        class="btn btn-ghost btn-sm"
      >
        <Pencil :size="16" />
      </router-link>
    </div>

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
