<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CardDoc } from '@/entities/cards/Card'
import { useCardsStore } from '@/entities/cards/cardsStore'
import FlashcardPracticeCard from './FlashcardPracticeCard.vue'

const props = defineProps<{
  cards: CardDoc[]
  index: number
}>()

const emit = defineEmits<{
  (event: 'complete'): void
  (event: 'advance'): void
}>()

const store = useCardsStore()
const isBusy = ref(false)

const currentCard = computed(() => props.cards[props.index])

const handleAnswer = async (score: number) => {
  if (!currentCard.value || isBusy.value) return
  isBusy.value = true
  try {
    await store.recordFlashcardReview(currentCard.value._id, score)
    if (props.index >= props.cards.length - 1) {
      emit('complete')
    } else {
      emit('advance')
    }
  } finally {
    isBusy.value = false
  }
}
</script>

<template>
  <div
    v-if="currentCard"
    class="w-full flex justify-center"
  >
    <FlashcardPracticeCard
      :card="currentCard"
      :position="index + 1"
      :total="cards.length"
      :is-busy="isBusy"
      @answered="handleAnswer"
    />
  </div>
  <div
    v-else
    class="text-center opacity-70"
  >
    No cards to practice right now.
  </div>
</template>
