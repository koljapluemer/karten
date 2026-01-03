<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCardsStore } from '@/entities/cards/cardsStore'
import DailyCountsChart from './DailyCountsChart.vue'
import StreakVisualization from './StreakVisualization.vue'

const store = useCardsStore()

onMounted(() => {
  store.loadAll()
})

const dailyCounts = computed(() => store.getDailyPracticeCounts(14))
const counts = computed(() => store.cardCounts)
const dueCount = computed(() => store.dueFlashcards.length)
const unseenCount = computed(() => store.unseenFlashcards.length)
const reviewCount = computed(() => store.progress.reduce((sum, entry) => sum + entry.totalReviews, 0))
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
          {{ counts.flashcard }} flashcards · {{ counts.task }} tasks · {{ counts.content }} content
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
