<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import type { TopicDoc } from '@/entities/topics/Topic'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import { useProgressStore } from '@/entities/progress/progressStore'
import { useTopicsStore } from '@/entities/topics/topicsStore'
import {
  buildProgressIndex,
  isDeclarativeDue,
  isDeclarativeMastered,
  isProceduralDue,
  isProceduralMastered
} from '@/entities/progress/progressHelpers'
import { pickRandom, shuffleArray, takeRandom } from '@/dumb/random'
import PracticeInstruction from '@/dumb/PracticeInstruction.vue'
import ActionButtonRow from '@/dumb/ActionButtonRow.vue'
import PracticeMemorizeTask from './tasks/PracticeMemorizeTask.vue'
import FlashcardPracticePanel from './tasks/FlashcardPracticePanel.vue'
import GoalYesNoTask from './tasks/GoalYesNoTask.vue'

const flashcardsStore = useFlashcardsStore()
const progressStore = useProgressStore()
const topicsStore = useTopicsStore()

type PracticeItem = {
  cardId: string
  cardType: FlashCardDoc['cardType']
  isNew: boolean
}

type SummaryStats = {
  total: number
  declarativeTotal: number
  declarativeCorrect: number
  goalsTotal: number
}

const phase = ref<'loading' | 'empty' | 'practice' | 'summary'>('loading')
const currentTopicId = ref<string | null>(null)
const queue = ref<PracticeItem[]>([])
const index = ref(0)
const summary = ref<SummaryStats>({
  total: 0,
  declarativeTotal: 0,
  declarativeCorrect: 0,
  goalsTotal: 0
})

const cardsById = computed<Record<string, FlashCardDoc>>(() => {
  const map: Record<string, FlashCardDoc> = {}
  flashcardsStore.flashcards.forEach((card) => {
    map[card._id] = card
  })
  return map
})

const currentTopic = computed(() =>
  currentTopicId.value
    ? topicsStore.topics.find((topic) => topic._id === currentTopicId.value) ?? null
    : null
)

const currentItem = computed(() => queue.value[index.value] ?? null)

const progressIndex = computed(() => buildProgressIndex(progressStore.progress))

const isMastered = (card: FlashCardDoc): boolean => {
  if (card.cardType === 'procedural') {
    return isProceduralMastered(progressIndex.value[card._id]?.procedural ?? null)
  }
  return isDeclarativeMastered(progressIndex.value[card._id]?.declarative ?? null)
}

const isDue = (card: FlashCardDoc): boolean => {
  if (card.cardType === 'procedural') {
    return isProceduralDue(progressIndex.value[card._id]?.procedural ?? null)
  }
  return isDeclarativeDue(progressIndex.value[card._id]?.declarative ?? null)
}

const buildQueueForTopic = (topic: TopicDoc): PracticeItem[] => {
  const allIds = topic.levels.flat()
  const uniqueIds = Array.from(new Set(allIds))
  const cards = uniqueIds
    .map((id) => cardsById.value[id])
    .filter((card): card is FlashCardDoc => Boolean(card))

  const dueCards = cards.filter((card) => isDue(card))
  const duePicked = dueCards.length > 15 ? takeRandom(dueCards, 15) : dueCards

  let selectedLevelIndex = Math.max(topic.levels.length - 1, 0)
  for (let i = 0; i < topic.levels.length; i += 1) {
    const levelCards = (topic.levels[i] ?? [])
      .map((id) => cardsById.value[id])
      .filter((card): card is FlashCardDoc => Boolean(card))
    if (!levelCards.length) continue
    if (!levelCards.every((card) => isMastered(card))) {
      selectedLevelIndex = i
      break
    }
  }
  const unseenCandidates = (topic.levels[selectedLevelIndex] ?? [])
    .map((id) => cardsById.value[id])
    .filter((card): card is FlashCardDoc => Boolean(card))
    .filter((card) => {
      const entry = progressIndex.value[card._id]
      return card.cardType === 'procedural'
        ? !entry?.procedural
        : !entry?.declarative
    })

  const remainingSlots = Math.max(17 - duePicked.length, 0)
  let unseenTarget = Math.min(remainingSlots, unseenCandidates.length)
  if (unseenTarget > 0 && unseenTarget < 2 && unseenCandidates.length >= 2 && remainingSlots >= 2) {
    unseenTarget = 2
  }

  const unseenPicked = unseenTarget > 0 ? takeRandom(unseenCandidates, unseenTarget) : []

  const combined = [
    ...duePicked.map((card) => ({ card, isNew: false })),
    ...unseenPicked.map((card) => ({ card, isNew: true }))
  ]

  const queueItems = shuffleArray(combined).map(({ card, isNew }) => ({
    cardId: card._id,
    cardType: card.cardType,
    isNew
  }))
  return queueItems
}

const ensureNoAdjacentDuplicates = (items: PracticeItem[]): PracticeItem[] => {
  if (items.length < 2) return items
  const result = [...items]
  for (let i = 1; i < result.length; i += 1) {
    const current = result[i]
    const previous = result[i - 1]
    if (!current || !previous) continue
    if (current.cardId === previous.cardId) {
      const swapIndex = result.findIndex(
        (item, idx) => idx > i && item.cardId !== previous.cardId
      )
      if (swapIndex > -1) {
        const temp = result[i] as PracticeItem
        result[i] = result[swapIndex] as PracticeItem
        result[swapIndex] = temp
      }
    }
  }
  return result
}

const startSession = () => {
  if (!topicsStore.topics.length) {
    phase.value = 'empty'
    return
  }
  const topic = pickRandom(topicsStore.topics) ?? topicsStore.topics[0]
  if (!topic) {
    phase.value = 'empty'
    return
  }
  currentTopicId.value = topic._id
  queue.value = ensureNoAdjacentDuplicates(buildQueueForTopic(topic))
  index.value = 0
  summary.value = {
    total: queue.value.length,
    declarativeTotal: 0,
    declarativeCorrect: 0,
    goalsTotal: 0
  }
  phase.value = queue.value.length ? 'practice' : 'summary'
}

const handleNext = () => {
  if (index.value >= queue.value.length - 1) {
    phase.value = 'summary'
    return
  }
  index.value += 1
}

const handleFlashcardDone = (payload: { score: number }) => {
  summary.value.declarativeTotal += 1
  if (payload.score >= 0.8) summary.value.declarativeCorrect += 1
  handleNext()
}

const handleMemorizeDone = () => {
  summary.value.declarativeTotal += 1
  handleNext()
}

const handleGoalDone = () => {
  summary.value.goalsTotal += 1
  handleNext()
}

const summaryText = computed(() => {
  const correctPercent = summary.value.declarativeTotal
    ? Math.round((summary.value.declarativeCorrect / summary.value.declarativeTotal) * 100)
    : 0
  return `Practiced ${summary.value.total} cards. ${summary.value.declarativeTotal} declarative (${correctPercent}% correct), ${summary.value.goalsTotal} goals.`
})

onMounted(async () => {
  phase.value = 'loading'
  await Promise.all([
    flashcardsStore.loadFlashcards(),
    progressStore.loadProgress(),
    topicsStore.loadTopics()
  ])
  startSession()
})
</script>

<template>
  <div class="w-full flex justify-center">
    <div class="w-full max-w-4xl space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold">
          Topic Practice
        </h1>
        <div
          v-if="currentTopic"
          class="text-sm opacity-70"
        >
          {{ currentTopic.name.join(' / ') }}
        </div>
      </div>

      <div
        v-if="phase === 'loading'"
        class="text-center opacity-70"
      >
        Loading...
      </div>

      <div
        v-else-if="phase === 'empty'"
        class="space-y-4"
      >
        <PracticeInstruction text="Create a topic to start practicing." />
        <RouterLink
          to="/topics"
          class="btn btn-primary w-full sm:w-auto"
        >
          Go to Topics
        </RouterLink>
      </div>

      <div
        v-else-if="phase === 'summary'"
        class="space-y-4"
      >
        <PracticeInstruction text="Session Summary" />
        <div class="rounded-xl bg-base-200 p-4 text-sm">
          {{ summaryText }}
        </div>
        <ActionButtonRow
          :actions="[{ id: 'next', label: 'Next Topic', variant: 'primary' }]"
          @select="startSession"
        />
      </div>

      <div
        v-else-if="currentItem"
        class="space-y-6"
      >
        <PracticeMemorizeTask
          v-if="currentItem.cardType === 'declaritive' && currentItem.isNew"
          :key="currentItem.cardId"
          :card-id="currentItem.cardId"
          @done="handleMemorizeDone"
        />
        <FlashcardPracticePanel
          v-else-if="currentItem.cardType === 'declaritive'"
          :key="currentItem.cardId"
          :card-id="currentItem.cardId"
          @answered="handleFlashcardDone"
        />
        <GoalYesNoTask
          v-else
          :key="currentItem.cardId"
          :card-id="currentItem.cardId"
          @done="handleGoalDone"
        />
      </div>

      <div
        v-else
        class="text-center opacity-70"
      >
        Nothing to practice right now.
      </div>
    </div>
  </div>
</template>
