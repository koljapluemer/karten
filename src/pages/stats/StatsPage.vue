<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { format, subDays, startOfDay } from 'date-fns'
import DailyCountsChart from './DailyCountsChart.vue'
import StreakVisualization from './StreakVisualization.vue'
import { loadFlashcards } from '@/entities/flashcard/flashcardStore'
import { loadLearningProgress } from '@/entities/learning-progress/LearningProgressStore'
import { loadReviewCounts } from '@/entities/review-count/reviewCountStore'
import type { FlashCard } from '@/db/Flashcard'
import type { LearningProgress } from '@/db/LearningProgress'
import type { ReviewCount } from '@/db/ReviewCount'

type ChartDataPoint = {
  date: string
  count: number
}

const flashcards = ref<FlashCard[]>([])
const progress = ref<LearningProgress[]>([])
const reviewCounts = ref<ReviewCount[]>([])
const isLoading = ref(true)

const progressIdToFlashcardId = (progressId: string): string =>
  progressId.replace('learning-progress:', 'flashcard:')

const loadData = async () => {
  isLoading.value = true
  const [cards, progressDocs, countDocs] = await Promise.all([
    loadFlashcards(),
    loadLearningProgress(),
    loadReviewCounts()
  ])
  flashcards.value = cards
  progress.value = progressDocs
  reviewCounts.value = countDocs
  isLoading.value = false
}

onMounted(() => {
  void loadData()
})

const flashcardIds = computed(() => new Set(flashcards.value.map(card => card.id)))
const progressForExistingCards = computed(() =>
  progress.value.filter(item => flashcardIds.value.has(progressIdToFlashcardId(item.id)))
)
const progressFlashcardIds = computed(() =>
  new Set(progressForExistingCards.value.map(item => progressIdToFlashcardId(item.id)))
)

const unseenCount = computed(() =>
  flashcards.value.filter(card => !progressFlashcardIds.value.has(card.id)).length
)

const dueCount = computed(() => {
  const now = new Date()
  return progressForExistingCards.value.filter(item => new Date(item.due) <= now).length
})

const notDueCount = computed(() => {
  const now = new Date()
  return progressForExistingCards.value.filter(item => new Date(item.due) > now).length
})

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
</script>

<template>
  <div class="w-full max-w-full">
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
        class="stats stats-vertical lg:stats-horizontal shadow"
      >
        <div class="stat">
          <div class="stat-title text-light">
            Unseen
          </div>
          <div class="stat-value">
            {{ unseenCount }}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title text-light">
            Due
          </div>
          <div class="stat-value">
            {{ dueCount }}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title text-light">
            Not due
          </div>
          <div class="stat-value">
            {{ notDueCount }}
          </div>
        </div>
      </div>

      <div>
        <h2 class="text-xl font-semibold mb-4">
          Streak
        </h2>
        <StreakVisualization :data="dailyFlips" />
      </div>

      <div>
        <h2 class="text-xl font-semibold mb-4">
          Flipped flashcards per day
        </h2>
        <DailyCountsChart
          :data="dailyFlips"
          label="Flips"
        />
      </div>
    </div>
  </div>
</template>
