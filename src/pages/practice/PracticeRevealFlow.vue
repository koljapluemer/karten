<script setup lang="ts">
import { ref, watch } from 'vue'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'
import type { FlashCard } from '@/db/Flashcard'
import type { Tag } from '@/db/Tag'
import { Rating } from 'ts-fsrs'

const props = defineProps<{
  card: FlashCard
  tags?: Tag[]
}>()

const emit = defineEmits<{
  (event: 'complete', rating: Rating): void
  (event: 'confused'): void
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

const handleConfused = () => {
  emit('confused')
}
</script>

<template>
  <div class="space-y-4">
    <FlashcardRenderer
      :front="card.front"
      :back="card.back"
      :show-back="isRevealed"
      :tags="props.tags"
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
      class="flex justify-center gap-2"
    >
      <button
        class="btn btn-outline"
        @click="handleConfused"
      >
        Confused
      </button>
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
</template>
