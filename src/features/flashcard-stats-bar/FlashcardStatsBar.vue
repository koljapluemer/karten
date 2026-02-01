<script setup lang="ts">
import { computed } from 'vue'
import type { FlashcardCategoryCounts } from './types'

const props = defineProps<{
  counts: FlashcardCategoryCounts
}>()

const total = computed(() =>
  props.counts.unseenBlocked +
  props.counts.unseenNotBlocked +
  props.counts.dueBlocked +
  props.counts.dueNotBlocked +
  props.counts.seenNotDue
)

const segments = computed(() => [
  {
    label: 'Unseen (blocked)',
    count: props.counts.unseenBlocked,
    color: 'bg-base-300'
  },
  {
    label: 'Unseen',
    count: props.counts.unseenNotBlocked,
    color: 'bg-info'
  },
  {
    label: 'Due (blocked)',
    count: props.counts.dueBlocked,
    color: 'bg-warning/50'
  },
  {
    label: 'Due',
    count: props.counts.dueNotBlocked,
    color: 'bg-warning'
  },
  {
    label: 'Not due',
    count: props.counts.seenNotDue,
    color: 'bg-success'
  }
])

const visibleSegments = computed(() =>
  segments.value.filter(s => s.count > 0)
)

const getWidth = (count: number): string => {
  if (total.value === 0) return '0%'
  return `${(count / total.value) * 100}%`
}
</script>

<template>
  <div
    v-if="total > 0"
    class="flex h-4 w-full rounded overflow-hidden"
  >
    <div
      v-for="segment in visibleSegments"
      :key="segment.label"
      :class="segment.color"
      :style="{ width: getWidth(segment.count) }"
      :title="`${segment.label}: ${segment.count}`"
      class="h-full"
    />
  </div>
  <div
    v-else
    class="h-4 w-full bg-base-300 rounded"
  />
  <div
    v-if="total > 0"
    class="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs"
  >
    <span
      v-for="segment in visibleSegments"
      :key="segment.label"
      class="flex items-center gap-1"
    >
      <span
        :class="segment.color"
        class="w-2 h-2 rounded"
      />
      {{ segment.label }}: {{ segment.count }}
    </span>
  </div>
</template>
