<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import { useProgressStore } from '@/entities/progress/progressStore'
import FlashcardRenderer from '@/entities/flashcards/FlashcardRenderer.vue'
import ActionButtonRow from '@/dumb/ActionButtonRow.vue'

const props = defineProps<{
  cardId: string
}>()

const emit = defineEmits<{
  (event: 'done', payload: { success: boolean }): void
}>()

const flashcardsStore = useFlashcardsStore()
const progressStore = useProgressStore()

const card = computed(() =>
  flashcardsStore.flashcards.find((entry) => entry._id === props.cardId)
)

const isSaving = ref(false)

const handleAnswer = async (success: boolean) => {
  if (!card.value || isSaving.value) return
  isSaving.value = true
  try {
    const nextAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await progressStore.updateProceduralProgress(card.value._id, {
      isAchieved: success,
      practiceNextAt: nextAt
    })
    await flashcardsStore.addLog(card.value._id, 'PRACTICED_GOAL')
    emit('done', { success })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-4xl space-y-6">
    <div
      v-if="card"
      class="w-full"
    >
      <FlashcardRenderer
        :front="card.front"
        :back="card.back"
        :card-type="card.cardType"
        :instruction="card.instruction"
        :show-back="false"
      />
    </div>

    <ActionButtonRow
      :actions="[
        { id: 'yes', label: 'Yes', variant: 'primary', disabled: isSaving },
        { id: 'no', label: 'No', variant: 'outline', disabled: isSaving }
      ]"
      @select="(id) => handleAnswer(id === 'yes')"
    />
  </div>
</template>
