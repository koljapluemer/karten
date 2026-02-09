<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Pencil, Ban, Flag, Trash2 } from 'lucide-vue-next'
import { loadFlashcards, updateFlashcard, deleteFlashcard } from '@/entities/flashcard/flashcardStore'
import { loadTags } from '@/entities/tag/tagStore'
import { loadUserSettings } from '@/entities/user-settings/userSettingsStore'
import { pickRandom, randomInt } from '@/dumb/random'
import type { Tag } from '@/db/Tag'
import type { UserSettings } from '@/db/UserSettings'
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
import { Rating } from 'ts-fsrs'
import PracticeMemorizeFlow from './PracticeMemorizeFlow.vue'
import PracticeRevealFlow from './PracticeRevealFlow.vue'
import PreviousKnowledgeGeneratorModal from './PreviousKnowledgeGeneratorModal.vue'

const router = useRouter()

const memorizeFlowRef = ref<InstanceType<typeof PracticeMemorizeFlow> | null>(null)
const revealFlowRef = ref<InstanceType<typeof PracticeRevealFlow> | null>(null)
const showShortcuts = ref(false)

const flashcards = ref<FlashCard[]>([])
const allTags = ref<Tag[]>([])
const userSettings = ref<UserSettings | null>(null)
const progressMap = ref<Map<string, LearningProgress>>(new Map())
const learningProgressByFlashcardId = progressMap
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
  const [cards, progressDocs, tags, settings] = await Promise.all([
    loadFlashcards(),
    loadLearningProgress(),
    loadTags(),
    loadUserSettings()
  ])

  flashcards.value = cards
  allTags.value = tags
  userSettings.value = settings

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

  // Tag-based selection
  const roll = randomInt(0, 9)
  const untaggedPriorityValue = userSettings.value?.untaggedPriority ?? 5

  const eligibleTagIds = new Set(
    allTags.value
      .filter(tag => tag.priority <= roll)
      .map(tag => tag.id)
  )

  const untaggedEligible = untaggedPriorityValue <= roll

  const hasEligibleTag = (card: FlashCard): boolean => {
    const cardTags = card.tags ?? []

    // Untagged cards: check untagged priority
    if (cardTags.length === 0) {
      return untaggedEligible
    }

    // Tagged cards: check if any tag is eligible
    return cardTags.some(tagId => eligibleTagIds.has(tagId))
  }

  // Determine primary and fallback pools based on preference
  const primaryPool = preferUnseen && unseen.length > 0 ? unseen : due
  const fallbackPool = preferUnseen && unseen.length > 0 ? due : unseen

  // Try tag-filtered primary pool
  if (eligibleTagIds.size > 0) {
    const tagFilteredPrimary = primaryPool.filter(hasEligibleTag)
    if (tagFilteredPrimary.length > 0) {
      return pickRandom(tagFilteredPrimary) ?? null
    }

    // Try tag-filtered fallback pool
    const tagFilteredFallback = fallbackPool.filter(hasEligibleTag)
    if (tagFilteredFallback.length > 0) {
      return pickRandom(tagFilteredFallback) ?? null
    }
  }

  // Fall back to existing flow (ignore tags)
  let nextCard: FlashCard | null = null
  if (preferUnseen && unseen.length > 0) {
    nextCard = pickRandom(unseen) ?? null
  } else if (due.length > 0) {
    nextCard = pickRandom(due) ?? null
  } else if (unseen.length > 0) {
    nextCard = pickRandom(unseen) ?? null
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

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Control' || e.key === 'Meta') {
    showShortcuts.value = true
    return
  }

  if (showPreviousKnowledgeModal.value) return

  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

  if (!currentCard.value) return

  // Ignore key presses with modifiers to avoid capturing Ctrl+C as "C", etc.
  if (e.ctrlKey || e.metaKey || e.altKey) return

  const key = e.key.toLowerCase()
  const isAction = e.key === 'Enter' || e.key === ' '

  if (key === 'e') {
    e.preventDefault()
    router.push(`/flashcards/${currentCard.value.id}/edit?returnTo=/practice`)
    return
  }

  if (key === 'd') {
    e.preventDefault()
    handleDelete()
    return
  }

  if (memorizeFlowRef.value) {
    const flow = memorizeFlowRef.value
    if (isAction) {
      e.preventDefault()
      if (flow.phase === 'memorize') flow.skipToRecall()
      else if (flow.phase === 'recall') flow.reveal()
      else if (flow.phase === 'reveal') flow.done()
    } else if (key === 'c' && flow.phase === 'reveal') {
      e.preventDefault()
      flow.confused()
    }
    return
  }

  if (revealFlowRef.value) {
    const flow = revealFlowRef.value
    if (isAction && !flow.isRevealed) {
      e.preventDefault()
      flow.reveal()
    } else if (flow.isRevealed) {
      if (key === '1') { e.preventDefault(); flow.rate(Rating.Again) }
      else if (key === '2') { e.preventDefault(); flow.rate(Rating.Hard) }
      else if (key === '3') { e.preventDefault(); flow.rate(Rating.Good) }
      else if (key === '4') { e.preventDefault(); flow.rate(Rating.Easy) }
      else if (key === 'c') { e.preventDefault(); flow.confused() }
    }
  }
}

function onKeyup(e: KeyboardEvent) {
  if (e.key === 'Control' || e.key === 'Meta') {
    showShortcuts.value = false
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('keyup', onKeyup)
  await loadData()
  currentCard.value = selectNextCard()
  isLoading.value = false
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('keyup', onKeyup)
})
</script>

<template>
  <div class="flex flex-col gap-4 items-center w-full max-w-lg mx-auto flex-1 pt-10 px-4">
    <div
      v-if="currentCard"
      class="flex justify-center gap-1  items-center"
    >
      <router-link
        :to="`/flashcards/${currentCard.id}/edit?returnTo=/practice`"
        class="btn btn-ghost btn-sm"
      >
        <Pencil />
      </router-link>
      <button
        class="btn btn-ghost btn-sm"
        @click="handleDisable"
      >
        <Ban />
      </button>
      <button
        class="btn btn-sm"
        :class="isCurrentCardArchived ? 'btn-secondary' : 'btn-ghost'"
        @click="handleToggleArchive"
      >
        <Flag />
      </button>
      <button
        class="btn btn-ghost btn-sm"
        @click="handleDelete"
      >
        <Trash2 />
      </button>
    </div>

    <div v-if="isLoading">
      Loading...
    </div>

    <div v-else-if="!currentCard">
      No cards available to practice right now.
    </div>

    <PracticeMemorizeFlow
      v-else-if="isCurrentCardNew"
      ref="memorizeFlowRef"
      class="flex-1 w-full"
      :card="currentCard"
      :tags="currentCardTags"
      :show-shortcuts="showShortcuts"
      @complete="handleNewCardComplete"
      @confused="handleConfused"
    />

    <PracticeRevealFlow
      v-else
      ref="revealFlowRef"
      class="flex-1 w-full"
      :card="currentCard"
      :tags="currentCardTags"
      :leech-streak-count="learningProgressByFlashcardId.get(currentCard.id)?.leechStreakCount"
      :show-shortcuts="showShortcuts"
      @complete="handleKnownCardComplete"
      @confused="handleConfused"
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
