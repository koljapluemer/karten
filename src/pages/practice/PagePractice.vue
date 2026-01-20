<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Pencil, Ban, Flag, Trash2 } from 'lucide-vue-next'
import { loadFlashcards, updateFlashcard, deleteFlashcard } from '@/entities/flashcard/flashcardStore'
import { loadTags } from '@/entities/tag/tagStore'
import type { Tag } from '@/db/Tag'
import {
  loadLearningProgress,
  initializeNewCard,
  updateCardProgress,
  setCardDisabled,
  toggleCardArchived
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
const allTags = ref<Tag[]>([])
const progressMap = ref<Map<string, LearningProgress>>(new Map())
const currentCard = ref<FlashCard | null>(null)
const recentCardIds = ref<string[]>([])
const COOLDOWN_SIZE = 4
const isLoading = ref(true)

const pendingCard = ref<FlashCard | null>(null)
const showPreviousKnowledgeModal = ref(false)

const isCurrentCardNew = computed(() =>
  currentCard.value ? !progressMap.value.has(currentCard.value.id) : false
)

const isCurrentCardArchived = computed(() => {
  if (!currentCard.value) return false
  const progress = progressMap.value.get(currentCard.value.id)
  return progress?.isArchived ?? false
})

const currentCardTags = computed(() => {
  if (!currentCard.value) return []
  const tagIds = currentCard.value.tags ?? []
  return allTags.value.filter(tag => tagIds.includes(tag.id))
})

function addToRecentCards(cardId: string) {
  recentCardIds.value = [cardId, ...recentCardIds.value].slice(0, COOLDOWN_SIZE)
}

async function loadData() {
  const [cards, progressDocs, tags] = await Promise.all([
    loadFlashcards(),
    loadLearningProgress(),
    loadTags()
  ])

  flashcards.value = cards
  allTags.value = tags

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
  const notDisabled = flashcards.value.filter((c) => {
    const progress = progressMap.value.get(c.id)
    return !progress?.isDisabled
  })
  const eligible = notDisabled.filter(isCardEligible)

  if (eligible.length === 0) return null

  // Exclude recent cards to prevent repeats (4-card cooldown)
  const eligibleExcludingRecent = eligible.filter((c) => !recentCardIds.value.includes(c.id))

  // If all eligible cards were filtered out, use eligible
  const pool = eligibleExcludingRecent.length > 0 ? eligibleExcludingRecent : eligible

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
  addToRecentCards(completedCardId)
  currentCard.value = selectNextCard()
}

async function handleKnownCardComplete(rating: Rating) {
  if (!currentCard.value) return

  const completedCardId = currentCard.value.id
  await updateCardProgress(completedCardId, rating)
  await incrementReviewCountForToday()
  await loadData()
  addToRecentCards(completedCardId)
  currentCard.value = selectNextCard()
}

function handleConfused() {
  if (!currentCard.value) return

  const apiKey = getOpenAIKey()
  if (!apiKey) {
    showToast('Please set OpenAI API key in settings', 'error')
    router.push('/settings')
    return
  }

  pendingCard.value = currentCard.value
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
      updatedBlockedBy
    )
    showToast(`Added ${cardIds.length} flashcards as previous knowledge`, 'success')
  }

  // Apply "Again" rating after generating previous knowledge
  if (pendingCard.value) {
    const completedCardId = pendingCard.value.id
    await updateCardProgress(completedCardId, 1 as Rating)
    await incrementReviewCountForToday()
    await loadData()
    addToRecentCards(completedCardId)
    currentCard.value = selectNextCard()
    pendingCard.value = null
  }
}

async function handlePreviousKnowledgeClose() {
  showPreviousKnowledgeModal.value = false

  // Apply "Again" rating even if modal is closed without generating
  if (pendingCard.value) {
    const completedCardId = pendingCard.value.id
    await updateCardProgress(completedCardId, 1 as Rating)
    await incrementReviewCountForToday()
    await loadData()
    addToRecentCards(completedCardId)
    currentCard.value = selectNextCard()
    pendingCard.value = null
  }
}

async function handleDisable() {
  if (!currentCard.value) return
  await setCardDisabled(currentCard.value.id, true)
  await loadData()
  currentCard.value = selectNextCard()
}

async function handleToggleArchive() {
  if (!currentCard.value) return
  await toggleCardArchived(currentCard.value.id)
  await loadData()
}

async function handleDelete() {
  if (!currentCard.value) return
  if (!confirm('Delete this flashcard?')) return
  const cardId = currentCard.value.id
  await deleteFlashcard(cardId)
  await loadData()
  currentCard.value = selectNextCard()
}

onMounted(async () => {
  await loadData()
  currentCard.value = selectNextCard()
  isLoading.value = false
})
</script>

<template>
  <div class="flex flex-col gap-4 items-center min-w-lg flex-1 pt-10">
    <div v-if="currentCard" class="flex justify-center gap-1  items-center">
      <router-link :to="`/flashcards/${currentCard.id}/edit?returnTo=/practice`" class="btn btn-ghost btn-sm">
        <Pencil />
      </router-link>
      <button class="btn btn-ghost btn-sm" @click="handleDisable">
        <Ban />
      </button>
      <button class="btn btn-sm" :class="isCurrentCardArchived ? 'btn-secondary' : 'btn-ghost'"
        @click="handleToggleArchive">
        <Flag />
      </button>
      <button class="btn btn-ghost btn-sm" @click="handleDelete">
        <Trash2 />
      </button>
    </div>

    <div v-if="isLoading">
      Loading...
    </div>

    <div v-else-if="!currentCard">
      No cards available to practice right now.
    </div>

    <PracticeMemorizeFlow v-else-if="isCurrentCardNew" :card="currentCard" :tags="currentCardTags"
      @complete="handleNewCardComplete" />

    <PracticeRevealFlow v-else :card="currentCard" :tags="currentCardTags" @complete="handleKnownCardComplete"
      @confused="handleConfused" />

    <PreviousKnowledgeGeneratorModal v-if="pendingCard" :open="showPreviousKnowledgeModal" :card="pendingCard"
      @close="handlePreviousKnowledgeClose" @accept="handlePreviousKnowledgeAccept" />
  </div>
</template>
