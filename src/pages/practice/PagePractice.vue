<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Pencil, Ban, Flag, Trash2, Target, X } from 'lucide-vue-next'
import { loadFlashcards, updateFlashcard, deleteFlashcard } from '@/entities/flashcard/flashcardStore'
import { pickRandom } from '@/dumb/random'
import {
  loadLearningProgress,
  initializeNewCard,
  updateCardProgress,
  setCardDisabled,
  toggleCardArchived
} from '@/entities/learning-progress/LearningProgressStore'
import { incrementReviewCountForToday, getReviewCountForToday } from '@/entities/review-count/reviewCountStore'
import { loadUserSettings } from '@/entities/user-settings/userSettingsStore'
import { getOpenAIKey } from '@/dumb/openAIKey'
import { showToast } from '@/dumb/toastStore'
import type { FlashCard } from '@/db/Flashcard'
import type { LearningProgress } from '@/db/LearningProgress'
import { Rating } from 'ts-fsrs'
import DailyGoalProgressBar from './DailyGoalProgressBar.vue'
import PracticeMemorizeFlow from './PracticeMemorizeFlow.vue'
import PracticeRevealFlow from './PracticeRevealFlow.vue'
import PreviousKnowledgeGeneratorModal from './PreviousKnowledgeGeneratorModal.vue'
import FocusModeModal from './FocusModeModal.vue'
import { useFocusFilter } from './useFocusFilter'

const router = useRouter()

const memorizeFlowRef = ref<InstanceType<typeof PracticeMemorizeFlow> | null>(null)
const revealFlowRef = ref<InstanceType<typeof PracticeRevealFlow> | null>(null)
const showShortcuts = ref(false)

const flashcards = ref<FlashCard[]>([])
const progressMap = ref<Map<string, LearningProgress>>(new Map())
const learningProgressByFlashcardId = progressMap
const currentCard = ref<FlashCard | null>(null)
const recentCardIds = ref<string[]>([])
const hotPool = ref<string[]>([])
const COOLDOWN_SIZE = 4
const isLoading = ref(true)

const pendingCard = ref<FlashCard | null>(null)
const showPreviousKnowledgeModal = ref(false)
const showFocusModeModal = ref(false)
const { focusFilter } = useFocusFilter()
const dailyGoal = ref(0)
const todayCount = ref(0)

const isCurrentCardNew = computed(() =>
  currentCard.value ? !progressMap.value.has(currentCard.value.id) : false
)

const isCurrentCardArchived = computed(() => {
  if (!currentCard.value) return false
  const progress = progressMap.value.get(currentCard.value.id)
  return progress?.isArchived ?? false
})

function addToRecentCards(cardId: string) {
  recentCardIds.value = [cardId, ...recentCardIds.value].slice(0, COOLDOWN_SIZE)
}

function processHotPool(card: FlashCard) {
  for (const id of card.befriendedCards ?? []) {
    if (!hotPool.value.includes(id)) hotPool.value.push(id)
  }
  if (hotPool.value.length > 0) {
    hotPool.value.splice(Math.floor(Math.random() * hotPool.value.length), 1)
  }
}

async function loadData() {
  const [cards, progressDocs, settings, count] = await Promise.all([
    loadFlashcards(),
    loadLearningProgress(),
    loadUserSettings(),
    getReviewCountForToday()
  ])

  flashcards.value = cards
  dailyGoal.value = settings.dailyFlippedCardGoal
  todayCount.value = count

  const map = new Map<string, LearningProgress>()
  progressDocs.forEach((p) => {
    const flashcardId = p.id.replace('learning-progress:', 'flashcard:')
    map.set(flashcardId, p)
  })
  progressMap.value = map
}

function isCardEligible(card: FlashCard): boolean {
  for (const blockedId of card.blockedBy) {
    if (!progressMap.value.has(blockedId)) return false
  }
  return true
}

function isDueCard(card: FlashCard): boolean {
  const p = progressMap.value.get(card.id)
  return !!p && new Date(p.due) <= new Date()
}

function getEligiblePool(): FlashCard[] {
  const notDisabled = flashcards.value.filter((c) => !progressMap.value.get(c.id)?.isDisabled)
  const eligible = notDisabled.filter(isCardEligible)
  const excludingRecent = eligible.filter((c) => !recentCardIds.value.includes(c.id))
  return excludingRecent.length > 0 ? excludingRecent : eligible
}

function selectFocusCard(pool: FlashCard[]): FlashCard | null {
  const filter = focusFilter.value!.toLowerCase()
  const focused = pool.filter(
    (c) => c.front.toLowerCase().includes(filter) || c.back.toLowerCase().includes(filter)
  )

  const due = focused.filter(isDueCard)
  if (due.length > 0) return pickRandom(due) ?? null

  const unseen = focused.filter((c) => !progressMap.value.has(c.id))
  if (unseen.length > 0) return pickRandom(unseen) ?? null

  const seenNotDue = focused.filter((c) => progressMap.value.has(c.id) && !isDueCard(c))
  if (seenNotDue.length > 0) {
    seenNotDue.sort(
      (a, b) =>
        new Date(progressMap.value.get(a.id)!.due).getTime() -
        new Date(progressMap.value.get(b.id)!.due).getTime()
    )
    return seenNotDue[0] ?? null
  }

  return null
}

function selectNextCard(): FlashCard | null {
  const pool = getEligiblePool()
  if (pool.length === 0) return null

  if (focusFilter.value) {
    if (Math.random() < 5 / 6) {
      return selectFocusCard(pool)
    } else {
      const globalDue = pool.filter(isDueCard)
      return pickRandom(globalDue) ?? selectFocusCard(pool) ?? null
    }
  }

  const unseen = pool.filter((c) => !progressMap.value.has(c.id))
  const due = pool.filter(isDueCard)

  const preferUnseen = Math.random() < 0.1
  const primaryPool = preferUnseen && unseen.length > 0 ? unseen : due
  const fallbackPool = preferUnseen && unseen.length > 0 ? due : unseen

  if (Math.random() < 0.5 && hotPool.value.length > 0) {
    const primaryIds = new Set(primaryPool.map((c) => c.id))
    const hotCandidates = hotPool.value
      .map((id) => primaryPool.find((c) => c.id === id))
      .filter((c): c is FlashCard => c !== undefined && primaryIds.has(c.id))
    const picked = pickRandom(hotCandidates)
    if (picked) return picked
  }

  return pickRandom(primaryPool) ?? pickRandom(fallbackPool) ?? null
}

async function handleNewCardComplete() {
  if (!currentCard.value) return

  const completedCard = currentCard.value
  await initializeNewCard(completedCard.id)
  await incrementReviewCountForToday()
  processHotPool(completedCard)
  await loadData()
  addToRecentCards(completedCard.id)
  currentCard.value = selectNextCard()
}

async function handleKnownCardComplete(rating: Rating) {
  if (!currentCard.value) return

  const completedCard = currentCard.value
  await updateCardProgress(completedCard.id, rating)
  await incrementReviewCountForToday()
  processHotPool(completedCard)
  await loadData()
  addToRecentCards(completedCard.id)
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
      updatedBlockedBy,
      pendingCard.value.frontMediaIds ?? [],
      pendingCard.value.backMediaIds ?? [],
      pendingCard.value.befriendedCards ?? []
    )
    showToast(`Added ${cardIds.length} flashcards as previous knowledge`, 'success')
  }

  // Apply "Again" rating after generating previous knowledge
  if (pendingCard.value) {
    const completedCard = pendingCard.value
    await updateCardProgress(completedCard.id, 1 as Rating)
    await incrementReviewCountForToday()
    processHotPool(completedCard)
    await loadData()
    addToRecentCards(completedCard.id)
    currentCard.value = selectNextCard()
    pendingCard.value = null
  }
}

async function handlePreviousKnowledgeClose() {
  showPreviousKnowledgeModal.value = false

  // Apply "Again" rating even if modal is closed without generating
  if (pendingCard.value) {
    const completedCard = pendingCard.value
    await updateCardProgress(completedCard.id, 1 as Rating)
    await incrementReviewCountForToday()
    processHotPool(completedCard)
    await loadData()
    addToRecentCards(completedCard.id)
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

  if (showPreviousKnowledgeModal.value || showFocusModeModal.value) return

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
  <DailyGoalProgressBar
    v-if="!isLoading"
    :current="todayCount"
    :goal="dailyGoal"
  />
  <div class="flex flex-col gap-4 items-center w-full max-w-lg mx-auto flex-1 pt-10 px-4">
    <div
      v-if="focusFilter"
      class="badge badge-primary gap-2 self-start py-3"
    >
      <Target class="w-3 h-3" />
      <span class="max-w-48 truncate">{{ focusFilter }}</span>
      <button @click="focusFilter = null">
        <X class="w-3 h-3" />
      </button>
    </div>

    <div
      v-if="currentCard"
      class="flex justify-center gap-1 items-center w-full"
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
      <button
        class="btn btn-sm"
        :class="focusFilter ? 'btn-primary' : 'btn-ghost'"
        @click="showFocusModeModal = true"
      >
        <Target />
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
      :show-shortcuts="showShortcuts"
      @complete="handleNewCardComplete"
      @confused="handleConfused"
    />

    <PracticeRevealFlow
      v-else
      ref="revealFlowRef"
      class="flex-1 w-full"
      :card="currentCard"
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

    <FocusModeModal
      :open="showFocusModeModal"
      :current-filter="focusFilter"
      @close="showFocusModeModal = false"
      @activate="(f) => { focusFilter = f; showFocusModeModal = false }"
      @deactivate="() => { focusFilter = null; showFocusModeModal = false }"
    />
  </div>
</template>
