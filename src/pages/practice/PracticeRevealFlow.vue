<script setup lang="ts">
import { ref, watch } from 'vue'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'
import type { FlashCard } from '@/db/Flashcard'
import type { Tag } from '@/db/Tag'
import { Rating } from 'ts-fsrs'
import { Sparkle } from 'lucide-vue-next'

const props = defineProps<{
  card: FlashCard
  tags?: Tag[]
  leechStreakCount?: number
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

const handleCardClick = () => {
  if (!isRevealed.value) isRevealed.value = true
}
</script>

<template>
  <div class="flex-1 flex flex-col w-full">
    <FlashcardRenderer
      :front="card.front"
      :back="card.back"
      :show-back="isRevealed"
      :tags="props.tags"
      @click="handleCardClick"
    />

    <div
      v-if="!isRevealed"
      class="mt-auto pb-4 flex justify-center"
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
      class="mt-auto pb-4 flex flex-col items-center gap-2"
    >
      <div
        v-if="(props.leechStreakCount ?? 0) > 3"
        class="alert alert-warning"
      >
        This card is a leech. Consider adapting it or add previous-knowledge cards.
      </div>
      <!-- Mobile: Confused full-width row -->
      <div class="w-full md:hidden">
        <button
          class="btn btn-outline w-full"
          @click="handleConfused"
        >
          <Sparkle :size="12" />
          Confused
        </button>
      </div>
      <!-- SR buttons row (+ desktop Confused) -->
      <div class="flex justify-center gap-2 w-full">
        <button
          class="btn btn-outline hidden md:flex"
          @click="handleConfused"
        >
          <Sparkle :size="12" />
          Confused
        </button>
        <button
          class="btn btn-outline flex-1 md:flex-none"
          @click="handleRating(Rating.Again)"
        >
          Again
        </button>
        <button
          class="btn btn-outline flex-1 md:flex-none"
          @click="handleRating(Rating.Hard)"
        >
          Hard
        </button>
        <button
          class="btn btn-outline flex-1 md:flex-none"
          @click="handleRating(Rating.Good)"
        >
          Good
        </button>
        <button
          class="btn btn-outline flex-1 md:flex-none"
          @click="handleRating(Rating.Easy)"
        >
          Easy
        </button>
      </div>
    </div>
  </div>
</template>
