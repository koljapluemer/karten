<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'
import type { FlashCard } from '@/db/Flashcard'

defineProps<{
  card: FlashCard
}>()

const emit = defineEmits<{
  (event: 'complete'): void
}>()

const durationMs = 5000
const remainingMs = ref(durationMs)
const phase = ref<'memorize' | 'recall' | 'reveal'>('memorize')
let timerId: number | null = null

const progressWidth = computed(() => `${(remainingMs.value / durationMs) * 100}%`)

const stopTimer = () => {
  if (timerId) {
    window.clearInterval(timerId)
    timerId = null
  }
}

const startTimer = () => {
  stopTimer()
  remainingMs.value = durationMs
  phase.value = 'memorize'

  timerId = window.setInterval(() => {
    remainingMs.value = Math.max(0, remainingMs.value - 100)
    if (remainingMs.value <= 0) {
      stopTimer()
      phase.value = 'recall'
    }
  }, 100)
}

const handleReveal = () => {
  phase.value = 'reveal'
}

const handleDone = () => {
  emit('complete')
}

onMounted(startTimer)
onBeforeUnmount(stopTimer)
</script>

<template>
  <div class="space-y-4">
    <FlashcardRenderer
      :front="card.front"
      :back="card.back"
      :show-back="phase !== 'recall'"
    />

    <div
      v-if="phase === 'memorize'"
      class="w-full bg-base-200 h-2 rounded"
    >
      <div
        class="h-full bg-primary transition-[width] duration-100"
        :style="{ width: progressWidth }"
      />
    </div>

    <div
      v-if="phase === 'recall'"
      class="flex justify-center"
    >
      <button
        class="btn btn-outline"
        @click="handleReveal"
      >
        Reveal
      </button>
    </div>

    <div
      v-else-if="phase === 'reveal'"
      class="flex justify-center"
    >
      <button
        class="btn btn-outline"
        @click="handleDone"
      >
        Done
      </button>
    </div>
  </div>
</template>
