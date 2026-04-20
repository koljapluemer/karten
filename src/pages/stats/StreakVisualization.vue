<script setup lang="ts">
import { computed } from 'vue'
import { Flame, Circle } from 'lucide-vue-next'
import { calculateStreak } from './streak'
type ChartDataPoint = {
  date: string
  count: number
}

const props = defineProps<{
  data: ChartDataPoint[]      // 14 days for display
  allData?: ChartDataPoint[]  // All data for streak calc
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
  const source = props.allData ?? props.data
  return calculateStreak(source)
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
          :size="16"
          class="text-orange-500"
        />
        <Circle
          v-else
          :size="16"
        />
      </div>
    </div>
    <div class="text-2xl font-bold">
      {{ streak }}
    </div>
  </div>
</template>
