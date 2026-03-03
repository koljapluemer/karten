<script setup lang="ts">
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  totalItems: number
  pageSize: number
  currentPage: number
}>()

const emit = defineEmits<{
  'update:currentPage': [value: number]
}>()

const totalPages = computed(() => {
  if (props.totalItems <= 0) return 1
  return Math.ceil(props.totalItems / props.pageSize)
})

const startItem = computed(() => {
  if (props.totalItems <= 0) return 0
  return (props.currentPage - 1) * props.pageSize + 1
})

const endItem = computed(() => {
  return Math.min(props.currentPage * props.pageSize, props.totalItems)
})

const canPrev = computed(() => props.currentPage > 1)
const canNext = computed(() => props.currentPage < totalPages.value)
const canFirst = computed(() => props.currentPage > 1)
const canLast = computed(() => props.currentPage < totalPages.value)

const showRange = computed(() => props.totalItems > 0)

const rangeText = computed(() => {
  if (!showRange.value) return 'Showing 0 items'
  if (props.totalItems <= props.pageSize) {
    return `Showing ${props.totalItems} item${props.totalItems === 1 ? '' : 's'}`
  }
  return `Showing ${startItem.value}–${endItem.value} of ${props.totalItems}`
})

type PageSlot = number | 'ellipsis'

const pageSlots = computed((): PageSlot[] => {
  const total = totalPages.value
  const current = props.currentPage
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const slots: PageSlot[] = [1]
  const left = Math.max(2, current - 1)
  const right = Math.min(total - 1, current + 1)
  if (left > 2) slots.push('ellipsis')
  for (let p = left; p <= right; p++) {
    if (p !== 1 && p !== total) slots.push(p)
  }
  if (right < total - 1) slots.push('ellipsis')
  if (total > 1) slots.push(total)
  return slots
})

const goTo = (page: number) => {
  const p = Math.max(1, Math.min(page, totalPages.value))
  emit('update:currentPage', p)
}

const goToPrev = () => canPrev.value && goTo(props.currentPage - 1)
const goToNext = () => canNext.value && goTo(props.currentPage + 1)
const goToFirst = () => canFirst.value && goTo(1)
const goToLast = () => canLast.value && goTo(totalPages.value)

const jumpInput = ref('')
watch(() => props.currentPage, (p) => {
  jumpInput.value = String(p)
}, { immediate: true })

const handleJump = () => {
  const n = parseInt(jumpInput.value, 10)
  if (!Number.isNaN(n) && n >= 1) {
    goTo(n)
    jumpInput.value = String(props.currentPage)
  } else {
    jumpInput.value = String(props.currentPage)
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4 my-8">
    <span
      v-if="showRange"
      class="text-sm text-base-content/70"
    >
      {{ rangeText }}
    </span>

    <div class="flex flex-wrap items-center gap-2">
      <div class="join">
        <button
          type="button"
          class="btn btn-sm join-item btn-ghost"
          :disabled="!canFirst"
          aria-label="First page"
          @click="goToFirst"
        >
          <ChevronsLeft class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="btn btn-sm join-item btn-ghost"
          :disabled="!canPrev"
          aria-label="Previous page"
          @click="goToPrev"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
      </div>

      <div class="join">
        <template
          v-for="(slot, idx) in pageSlots"
          :key="slot === 'ellipsis' ? `ellipsis-${idx}` : slot"
        >
          <button
            v-if="slot !== 'ellipsis'"
            type="button"
            class="btn btn-sm join-item min-w-9"
            :class="slot === currentPage ? 'btn-active' : 'btn-ghost'"
            :aria-label="`Page ${slot}`"
            :aria-current="slot === currentPage ? 'page' : undefined"
            @click="goTo(slot)"
          >
            {{ slot }}
          </button>
          <span
            v-else
            class="join-item flex items-center px-2 text-base-content/50"
            aria-hidden="true"
          >
            …
          </span>
        </template>
      </div>

      <div class="join">
        <button
          type="button"
          class="btn btn-sm join-item btn-ghost"
          :disabled="!canNext"
          aria-label="Next page"
          @click="goToNext"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="btn btn-sm join-item btn-ghost"
          :disabled="!canLast"
          aria-label="Last page"
          @click="goToLast"
        >
          <ChevronsRight class="w-4 h-4" />
        </button>
      </div>

      <div
        v-if="totalPages > 3"
        class="flex items-center gap-1 ml-2"
      >
        <label
          for="pagination-jump"
          class="text-sm text-base-content/70 whitespace-nowrap"
        >
          Go to
        </label>
        <input
          id="pagination-jump"
          v-model="jumpInput"
          type="number"
          min="1"
          :max="totalPages"
          class="input input-sm w-14 text-center"
          placeholder="Page"
          aria-label="Go to page number"
          @keydown.enter="handleJump"
          @blur="handleJump"
        >
      </div>
    </div>
  </div>
</template>
