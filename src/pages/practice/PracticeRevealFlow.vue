<script setup lang="ts">
import { ref, watch } from 'vue'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'
import type { FlashCardDoc } from '@/db/Flashcard'
import { Rating } from 'ts-fsrs'

const props = defineProps<{
  card: FlashCardDoc
}>()

const emit = defineEmits<{
  (event: 'complete', rating: Rating): void
}>()

const isRevealed = ref(false)

watch(() => props.card, () => {
  isRevealed.value = false
})

const handleReveal = () => {
  isRevealed.value = true
}

const handleRating = (rating: Rating) => {
  emit('complete', rating)
}
</script>

<template>
  <div class="space-y-4">
    <FlashcardRenderer
      :front="card.front"
      :back="card.back"
      :instruction="card.instruction"
      :show-back="isRevealed"
    />

    <div
      v-if="!isRevealed"
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
      v-else
      class="flex justify-center"
    >
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          class="btn btn-outline"
          @click="handleRating(Rating.Again)"
        >
          Again
        </button>
        <button
          class="btn btn-outline"
          @click="handleRating(Rating.Hard)"
        >
          Hard
        </button>
        <button
          class="btn btn-outline"
          @click="handleRating(Rating.Good)"
        >
          Good
        </button>
        <button
          class="btn btn-outline"
          @click="handleRating(Rating.Easy)"
        >
          Easy
        </button>
      </div>
    </div>
  </div>
</template>
