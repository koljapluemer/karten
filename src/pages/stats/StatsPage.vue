<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { format, subDays, startOfDay } from 'date-fns'
import DailyCountsChart from './DailyCountsChart.vue'
import StreakVisualization from './StreakVisualization.vue'
import FlashcardStatsBar from '@/features/flashcard-stats-bar/FlashcardStatsBar.vue'
import type { FlashcardCategoryCounts } from '@/features/flashcard-stats-bar/types'
import { loadFlashcards } from '@/entities/flashcard/flashcardStore'
import { loadLearningProgress } from '@/entities/learning-progress/LearningProgressStore'
import { loadReviewCounts } from '@/entities/review-count/reviewCountStore'
import { loadLearningContent } from '@/entities/learning-content/learningContentStore'
import { loadUserSettings } from '@/entities/user-settings/userSettingsStore'
import type { FlashCard } from '@/db/Flashcard'
import type { UserSettings } from '@/db/UserSettings'
import type { LearningProgress } from '@/db/LearningProgress'
import type { ReviewCount } from '@/db/ReviewCount'
import type { LearningContent } from '@/db/LearningContent'

type ChartDataPoint = {
  date: string
  count: number
}

const flashcards = ref<FlashCard[]>([])
const progress = ref<LearningProgress[]>([])
const reviewCounts = ref<ReviewCount[]>([])
const learningContent = ref<LearningContent[]>([])
const userSettings = ref<UserSettings | null>(null)
const isLoading = ref(true)

const progressIdToFlashcardId = (progressId: string): string =>
  progressId.replace('learning-progress:', 'flashcard:')

const loadData = async () => {
  isLoading.value = true
  const [cards, progressDocs, countDocs, contentDocs, settings] = await Promise.all([
    loadFlashcards(),
    loadLearningProgress(),
    loadReviewCounts(),
    loadLearningContent(),
    loadUserSettings()
  ])
  flashcards.value = cards
  progress.value = progressDocs
  reviewCounts.value = countDocs
  learningContent.value = contentDocs
  userSettings.value = settings
  isLoading.value = false
}

onMounted(() => {
  void loadData()
})

const flashcardIds = computed(() => new Set(flashcards.value.map(card => card.id)))
const progressForExistingCards = computed(() =>
  progress.value.filter(item => flashcardIds.value.has(progressIdToFlashcardId(item.id)))
)

const progressMap = computed(() => {
  const map = new Map<string, LearningProgress>()
  progressForExistingCards.value.forEach(p => {
    const flashcardId = progressIdToFlashcardId(p.id)
    map.set(flashcardId, p)
  })
  return map
})

const isCardBlocked = (card: FlashCard): boolean => {
  for (const blockedId of card.blockedBy) {
    const blockedProgress = progressMap.value.get(blockedId)
    if (!blockedProgress) return true
    const blockedDue = new Date(blockedProgress.due)
    if (blockedDue <= new Date()) return true
  }
  return false
}

const flashcardStats = computed<FlashcardCategoryCounts>(() => {
  const now = new Date()
  let unseenBlocked = 0
  let unseenNotBlocked = 0
  let dueBlocked = 0
  let dueNotBlocked = 0
  let seenNotDue = 0

  for (const card of flashcards.value) {
    const cardProgress = progressMap.value.get(card.id)
    const blocked = isCardBlocked(card)

    if (!cardProgress) {
      if (blocked) {
        unseenBlocked++
      } else {
        unseenNotBlocked++
      }
    } else if (new Date(cardProgress.due) <= now) {
      if (blocked) {
        dueBlocked++
      } else {
        dueNotBlocked++
      }
    } else {
      seenNotDue++
    }
  }

  return { unseenBlocked, unseenNotBlocked, dueBlocked, dueNotBlocked, seenNotDue }
})

const totalFlashcards = computed(() => flashcards.value.length)

const learningContentCount = computed(() => learningContent.value.length)

const learningContentWithoutFlashcardsCount = computed(() =>
  learningContent.value.filter(item => item.relatedFlashcards.length === 0).length
)

const dailyFlips = computed<ChartDataPoint[]>(() => {
  const today = startOfDay(new Date())
  const counts = new Map<string, number>(
    reviewCounts.value.map((item: ReviewCount) => [item.date, item.count])
  )

  const days: ChartDataPoint[] = []
  for (let i = 13; i >= 0; i--) {
    const day = subDays(today, i)
    const key = format(day, 'yyyy-MM-dd')
    days.push({ date: key, count: counts.get(key) ?? 0 })
  }

  return days
})

const allDailyFlips = computed<ChartDataPoint[]>(() => {
  return reviewCounts.value.map((item: ReviewCount) => ({
    date: item.date,
    count: item.count
  }))
})
</script>

<template>
  <h1 class="text-2xl font-bold mb-4">
    Stats
  </h1>

  <div class="grid gap-4">
    <div
      v-if="isLoading"
      class="text-light"
    >
      Loading...
    </div>
    <div
      v-else
      class="card bg-base-200 p-4"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-light">Flashcards</span>
        <span class="font-bold">{{ totalFlashcards }}</span>
      </div>
      <FlashcardStatsBar :counts="flashcardStats" />
    </div>

    <div
      v-if="!isLoading"
      class="stats stats-vertical lg:stats-horizontal shadow"
    >
      <div class="stat">
        <div class="stat-title text-light">
          Learning content
        </div>
        <div class="stat-value">
          {{ learningContentCount }}
        </div>
      </div>
      <div class="stat">
        <div class="stat-title text-light">
          Without flashcards
        </div>
        <div class="stat-value">
          {{ learningContentWithoutFlashcardsCount }}
        </div>
      </div>
    </div>

    <div>
      <h2 class="text-xl font-semibold mb-4">
        Streak
      </h2>
      <StreakVisualization
        :data="dailyFlips"
        :all-data="allDailyFlips"
      />
    </div>

    <div>
      <h2 class="text-xl font-semibold mb-4">
        Flipped flashcards per day
      </h2>
      <DailyCountsChart
        :data="dailyFlips"
        label="Flips"
        :goal="userSettings?.dailyFlippedCardGoal"
      />
    </div>
  </div>
</template>
