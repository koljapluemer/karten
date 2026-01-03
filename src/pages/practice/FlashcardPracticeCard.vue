<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import MarkdownContent from '@/dumb/MarkdownContent.vue'

const props = defineProps<{
  card: FlashCardDoc
  position: number
  total: number
  isBusy: boolean
}>()

const emit = defineEmits<{
  (event: 'answered', score: number): void
}>()

const isRevealed = ref(false)
const showBack = computed(() => isRevealed.value)

const handleReveal = () => {
  isRevealed.value = true
}

const handleAnswer = (score: number) => {
  if (props.isBusy) return
  emit('answered', score)
  isRevealed.value = false
}
</script>

<template>
  <div class="w-full max-w-3xl space-y-6">
    <div class="flex items-center justify-between text-sm opacity-70">
      <span>Flashcard</span>
      <span>{{ position }} / {{ total }}</span>
    </div>

    <div class="card bg-base-100 border border-base-300">
      <div class="card-body gap-6">
        <MarkdownContent :value="card.front" />

        <div
          v-if="showBack"
          class="border-t border-base-200 pt-4"
        >
          <MarkdownContent :value="card.back || ''" />
        </div>
      </div>
    </div>

    <div
      v-if="!showBack"
      class="flex justify-end"
    >
      <button
        class="btn btn-primary"
        @click="handleReveal"
      >
        Reveal
      </button>
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <div class="text-sm opacity-70">
        Did you remember correctly?
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          class="btn btn-outline"
          :disabled="isBusy"
          @click="handleAnswer(0)"
        >
          No
        </button>
        <button
          class="btn btn-outline"
          :disabled="isBusy"
          @click="handleAnswer(0.6)"
        >
          Kind Of
        </button>
        <button
          class="btn btn-outline"
          :disabled="isBusy"
          @click="handleAnswer(0.8)"
        >
          Yes
        </button>
        <button
          class="btn btn-outline"
          :disabled="isBusy"
          @click="handleAnswer(1)"
        >
          Easily
        </button>
      </div>
    </div>
  </div>
</template>
