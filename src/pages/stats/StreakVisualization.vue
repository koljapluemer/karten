<script setup lang="ts">
import { computed } from 'vue'
import { Flame, Circle } from 'lucide-vue-next'
type ChartDataPoint = {
  date: string
  count: number
}

const props = defineProps<{
  data: ChartDataPoint[]
}>()

interface DayData {
  date: string
  practiced: boolean
}

const last14Days = computed<DayData[]>(() =>
  props.data.map(day => ({
    date: day.date,
    practiced: day.count > 0
  }))
)

const streak = computed<number>(() => {
  const days = last14Days.value
  let currentStreak = 0
  let missedOne = false

  // Start from the most recent day and go backwards
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i]
    if (!day) continue

    if (day.practiced) {
      currentStreak++
      missedOne = false
    } else {
      // Didn't practice this day
      if (missedOne) {
        // Already missed one day, this breaks the streak
        break
      } else {
        // First miss, allow it but don't count it
        missedOne = true
      }
    }
  }

  return currentStreak
})
</script>

<template>
  <div class="flex items-center gap-4">
    <div class="flex gap-1">
      <div
        v-for="(day, index) in last14Days"
        :key="index"
        class="text-light"
      >
        <Flame
          v-if="day.practiced"
          
          class="text-orange-500"
        />
        <Circle
          v-else
          
        />
      </div>
    </div>
    <div class="text-2xl font-bold">
      {{ streak }}
    </div>
  </div>
</template>
