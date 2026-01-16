<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Pencil } from 'lucide-vue-next'
import { loadFlashcards, updateFlashcard } from '@/entities/flashcard/flashcardStore'
import {
  loadLearningProgress,
  initializeNewCard,
  updateCardProgress
} from '@/entities/learning-progress/LearningProgressStore'
import { incrementReviewCountForToday } from '@/entities/review-count/reviewCountStore'
import { getOpenAIKey } from '@/app/storage/openAIKey'
import { showToast } from '@/app/toast/toastStore'
import type { FlashCard } from '@/db/Flashcard'
import type { LearningProgress } from '@/db/LearningProgress'
import type { Rating } from 'ts-fsrs'
import PracticeMemorizeFlow from './PracticeMemorizeFlow.vue'
import PracticeRevealFlow from './PracticeRevealFlow.vue'
import PreviousKnowledgeGeneratorModal from './PreviousKnowledgeGeneratorModal.vue'

const router = useRouter()

const flashcards = ref<FlashCard[]>([])
const progressMap = ref<Map<string, LearningProgress>>(new Map())
const currentCard = ref<FlashCard | null>(null)
const previousCardId = ref<string | null>(null)
const isLoading = ref(true)

const pendingRating = ref<Rating | null>(null)
const pendingCard = ref<FlashCard | null>(null)
const showPreviousKnowledgeModal = ref(false)

const isCurrentCardNew = computed(() =>
  currentCard.value ? !progressMap.value.has(currentCard.value.id) : false
)

async function loadData() {
  const [cards, progressDocs] = await Promise.all([
    loadFlashcards(),
    loadLearningProgress()
  ])

  flashcards.value = cards

  const map = new Map<string, LearningProgress>()
  progressDocs.forEach((p) => {
    const flashcardId = p.id.replace('learning-progress:', 'flashcard:')
    map.set(flashcardId, p)
  })
  progressMap.value = map
}

function isCardEligible(card: FlashCard): boolean {
  for (const blockedId of card.blockedBy) {
    const blockedProgress = progressMap.value.get(blockedId)

    if (!blockedProgress) return false

    const blockedDue = new Date(blockedProgress.due)
    if (blockedDue <= new Date()) return false
  }

  return true
}

function selectNextCard(): FlashCard | null {
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

  const pickRandom = (items: FlashCard[]): FlashCard | null => {
    if (items.length === 0) return null
    return items[Math.floor(Math.random() * items.length)] ?? null
  }

  let nextCard: FlashCard | null = null
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

  // Rating 1 = Again, Rating 2 = Hard
  if (rating === 1 || rating === 2) {
    pendingRating.value = rating
    pendingCard.value = currentCard.value
    return
  }

  await applyRatingAndProceed(rating)
}

async function applyRatingAndProceed(rating: Rating) {
  if (!currentCard.value) return

  const completedCardId = currentCard.value.id
  await updateCardProgress(completedCardId, rating)
  await incrementReviewCountForToday()
  await loadData()
  previousCardId.value = completedCardId
  currentCard.value = selectNextCard()
  pendingRating.value = null
  pendingCard.value = null
}

function handleContinue() {
  if (pendingRating.value !== null) {
    applyRatingAndProceed(pendingRating.value)
  }
}

function handleGeneratePreviousKnowledge() {
  const apiKey = getOpenAIKey()
  if (!apiKey) {
    showToast('Please set OpenAI API key in settings', 'error')
    router.push('/settings')
    return
  }
  showPreviousKnowledgeModal.value = true
}

async function handlePreviousKnowledgeAccept(cardIds: string[]) {
  showPreviousKnowledgeModal.value = false

  if (pendingCard.value && cardIds.length > 0) {
    const updatedBlockedBy = [...pendingCard.value.blockedBy, ...cardIds]
    await updateFlashcard(
      pendingCard.value.id,
      pendingCard.value.front,
      pendingCard.value.back,
      pendingCard.value.instruction,
      updatedBlockedBy
    )
    showToast(`Added ${cardIds.length} flashcards as previous knowledge`, 'success')
  }

  if (pendingRating.value !== null) {
    await applyRatingAndProceed(pendingRating.value)
  }
}

function handlePreviousKnowledgeClose() {
  showPreviousKnowledgeModal.value = false
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

    <template v-else-if="pendingRating !== null && pendingCard">
      <div class="text-center mb-6">
        <p class="text-sm opacity-70 mb-4">
          This card was difficult. Would you like to generate prerequisite flashcards?
        </p>
        <div class="flex gap-2 justify-center">
          <button
            class="btn"
            @click="handleContinue"
          >
            Continue
          </button>
          <button
            class="btn btn-primary"
            @click="handleGeneratePreviousKnowledge"
          >
            Generate Previous Knowledge Flashcard
          </button>
        </div>
      </div>
    </template>

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

    <PreviousKnowledgeGeneratorModal
      v-if="pendingCard"
      :open="showPreviousKnowledgeModal"
      :card="pendingCard"
      @close="handlePreviousKnowledgeClose"
      @accept="handlePreviousKnowledgeAccept"
    />
  </div>
</template>
