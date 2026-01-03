<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import { useTaskcardsStore } from '@/entities/taskcards/taskcardsStore'
import { useLearningGoalsStore } from '@/entities/learning-goals/learningGoalsStore'
import { useProgressStore } from '@/entities/progress/progressStore'
import { usePracticeLogStore } from '@/entities/practice/practiceLogStore'
import * as ebisu from '@/entities/ebisu'
import DailyCountsChart from './DailyCountsChart.vue'
import StreakVisualization from './StreakVisualization.vue'

const flashcardsStore = useFlashcardsStore()
const taskcardsStore = useTaskcardsStore()
const learningGoalsStore = useLearningGoalsStore()
const progressStore = useProgressStore()
const practiceLogStore = usePracticeLogStore()

onMounted(() => {
  void Promise.all([
    flashcardsStore.loadFlashcards(),
    taskcardsStore.loadTaskcards(),
    learningGoalsStore.loadLearningGoals(),
    progressStore.loadProgress(),
    practiceLogStore.loadPracticeLogs()
  ])
})

const HOURS_IN_MS = 1000 * 60 * 60

const hoursSince = (isoTime: string): number => {
  const delta = Date.now() - Date.parse(isoTime)
  return Math.max(delta / HOURS_IN_MS, 0)
}

const dailyCounts = computed(() => practiceLogStore.getDailyPracticeCounts(14))
const counts = computed(() => ({
  flashcards: flashcardsStore.flashcards.length,
  taskcards: taskcardsStore.taskcards.length,
  learningGoals: learningGoalsStore.learningGoals.length,
  total:
    flashcardsStore.flashcards.length +
    taskcardsStore.taskcards.length +
    learningGoalsStore.learningGoals.length
}))

const dueCount = computed(() => {
  return flashcardsStore.flashcards.filter((card) => {
    const entry = progressStore.progressByCardId[card._id]
    if (!entry) return false
    const recall = ebisu.predictRecall(entry.model, hoursSince(entry.lastReviewedAt), true)
    return recall < 0.9
  }).length
})

const unseenCount = computed(() => {
  return flashcardsStore.flashcards.filter((card) => !progressStore.progressByCardId[card._id])
    .length
})

const reviewCount = computed(() =>
  progressStore.progress.reduce((sum, entry) => sum + entry.totalReviews, 0)
)
</script>

<template>
  <div class="w-full max-w-full space-y-8">
    <div>
      <h1 class="text-3xl font-bold">
        Stats
      </h1>
      <p class="text-sm opacity-70">
        Quick snapshot of your flashcards and practice streak.
      </p>
    </div>

    <div class="stats stats-vertical lg:stats-horizontal shadow">
      <div class="stat">
        <div class="stat-title">
          Cards
        </div>
        <div class="stat-value">
          {{ counts.total }}
        </div>
        <div class="stat-desc">
          {{ counts.flashcards }} flashcards · {{ counts.taskcards }} task cards · {{ counts.learningGoals }} goals
        </div>
      </div>
      <div class="stat">
        <div class="stat-title">
          Due or Unseen
        </div>
        <div class="stat-value">
          {{ dueCount + unseenCount }}
        </div>
        <div class="stat-desc">
          {{ dueCount }} due · {{ unseenCount }} unseen
        </div>
      </div>
      <div class="stat">
        <div class="stat-title">
          Total Reviews
        </div>
        <div class="stat-value">
          {{ reviewCount }}
        </div>
        <div class="stat-desc">
          Across all flashcards
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <h2 class="text-xl font-semibold">
        Streak
      </h2>
      <StreakVisualization />
    </div>

    <div class="space-y-4">
      <h2 class="text-xl font-semibold">
        Cards Seen (Last 14 Days)
      </h2>
      <DailyCountsChart
        :data="dailyCounts"
        label="Cards"
      />
    </div>
  </div>
</template>
