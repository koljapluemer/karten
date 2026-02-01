<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'
import { Sparkle } from 'lucide-vue-next'
import type { FlashCard } from '@/db/Flashcard'
import type { Tag } from '@/db/Tag'

const props = defineProps<{
  card: FlashCard
  tags?: Tag[]
}>()

const emit = defineEmits<{
  (event: 'complete'): void
  (event: 'confused'): void
}>()

const durationMs = computed(() => {
  const text = props.card.front + ' ' + props.card.back
  const wordCount = text.trim().split(/\s+/).length
  return Math.min(10000, Math.max(2500, 2500 + wordCount * 100))
})
const remainingMs = ref(durationMs.value)
const phase = ref<'memorize' | 'recall' | 'reveal'>('memorize')
let timerId: number | null = null

const progressWidth = computed(() => `${(remainingMs.value / durationMs.value) * 100}%`)

const stopTimer = () => {
  if (timerId) {
    window.clearInterval(timerId)
    timerId = null
  }
}

const startTimer = () => {
  stopTimer()
  remainingMs.value = durationMs.value
  phase.value = 'memorize'

  timerId = window.setInterval(() => {
    remainingMs.value = Math.max(0, remainingMs.value - 100)
    if (remainingMs.value <= 0) {
      stopTimer()
      phase.value = 'recall'
    }
  }, 100)
}

const handleCardClick = () => {
  if (phase.value === 'memorize') {
    stopTimer()
    phase.value = 'recall'
  } else if (phase.value === 'recall') {
    phase.value = 'reveal'
  }
}

const handleReveal = () => {
  phase.value = 'reveal'
}

const handleDone = () => {
  emit('complete')
}

const handleConfused = () => {
  emit('confused')
}

// Reset state when card changes (e.g., after delete)
watch(() => props.card, () => {
  startTimer()
}, { immediate: false })

onMounted(startTimer)
onBeforeUnmount(stopTimer)
</script>

<template>
  <FlashcardRenderer
    :front="props.card.front"
    :back="props.card.back"
    :show-back="phase !== 'recall'"
    :tags="props.tags"
    @click="handleCardClick"
  />

  <div
    v-if="phase === 'memorize'"
    class="w-full mt-2 bg-base-200 h-2 rounded"
  >
    <div
      class="h-full bg-primary transition-[width] duration-100"
      :style="{ width: progressWidth }"
    />
  </div>

  <div
    v-if="phase === 'recall'"
    class=" mt-2 flex justify-center"
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
    class="flex justify-center gap-2 mt-2"
  >
    <button
      class="btn btn-outline"
      @click="handleConfused"
    >
      <Sparkle :size="12" />
      Confused
    </button>
    <button
      class="btn btn-outline"
      @click="handleDone"
    >
      Done
    </button>
  </div>
</template>
