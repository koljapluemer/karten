<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import { useProgressStore } from '@/entities/progress/progressStore'
import FlashcardRenderer from '@/entities/flashcards/FlashcardRenderer.vue'
import PracticeInstruction from '@/dumb/PracticeInstruction.vue'
import ActionButtonRow from '@/dumb/ActionButtonRow.vue'

const props = defineProps<{
  cardId: string
}>()

const emit = defineEmits<{
  (event: 'done'): void
}>()

const flashcardsStore = useFlashcardsStore()
const progressStore = useProgressStore()

const card = computed(() =>
  flashcardsStore.flashcards.find((entry) => entry._id === props.cardId)
)

const durationMs = 5000
const remainingMs = ref(durationMs)
const phase = ref<'memorize' | 'recall' | 'reveal'>('memorize')
let timerId: number | null = null

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

const handleDone = async () => {
  if (!card.value) return
  const now = new Date().toISOString()
  await progressStore.updateDeclarativeProgress(card.value._id, 0.6, now)
  await flashcardsStore.addLog(card.value._id, 'PRACTICED_FLASHCARD', now)
  emit('done')
}

const progressWidth = computed(() => `${(remainingMs.value / durationMs) * 100}%`)

watch(() => props.cardId, startTimer)

onMounted(startTimer)

onBeforeUnmount(stopTimer)
</script>

<template>
  <div class="w-full max-w-4xl space-y-6">
    <PracticeInstruction
      v-if="phase === 'memorize'"
      text="Try to memorize this"
    />
    <PracticeInstruction
      v-else-if="phase === 'recall'"
      text="Do you remember this?"
    />
    <PracticeInstruction
      v-else
      text="Reveal"
    />

    <div
      v-if="card"
      class="w-full"
    >
      <FlashcardRenderer
        :front="card.front"
        :back="card.back"
        :card-type="card.cardType"
        :show-back="phase !== 'recall'"
      />
    </div>

    <div
      v-if="phase === 'memorize'"
      class="w-full bg-base-200 h-2 rounded"
    >
      <div
        class="h-full bg-primary transition-[width] duration-100"
        :style="{ width: progressWidth }"
      />
    </div>

    <ActionButtonRow
      v-if="phase === 'recall'"
      :actions="[{ id: 'reveal', label: 'Reveal', variant: 'primary' }]"
      @select="handleReveal"
    />

    <ActionButtonRow
      v-else-if="phase === 'reveal'"
      :actions="[{ id: 'done', label: 'Done', variant: 'primary' }]"
      @select="handleDone"
    />
  </div>
</template>
