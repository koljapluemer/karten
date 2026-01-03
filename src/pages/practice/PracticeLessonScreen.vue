<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import { useProgressStore } from '@/entities/progress/progressStore'
import { usePracticeLogStore } from '@/entities/practice/practiceLogStore'
import FlashcardPracticeCard from './FlashcardPracticeCard.vue'

const props = defineProps<{
  cards: FlashCardDoc[]
  index: number
}>()

const emit = defineEmits<{
  (event: 'complete'): void
  (event: 'advance'): void
}>()

const progressStore = useProgressStore()
const practiceLogStore = usePracticeLogStore()
const isBusy = ref(false)

const currentCard = computed(() => props.cards[props.index])

const handleAnswer = async (score: number) => {
  if (!currentCard.value || isBusy.value) return
  isBusy.value = true
  try {
    const now = new Date().toISOString()
    await progressStore.updateProgress(currentCard.value._id, score, now)
    await practiceLogStore.logPractice(currentCard.value._id, now)
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
