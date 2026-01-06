<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import { useProgressStore } from '@/entities/progress/progressStore'
import FlashcardRenderer from '@/entities/flashcards/FlashcardRenderer.vue'
import PracticeInstruction from '@/dumb/PracticeInstruction.vue'
import ActionButtonRow from '@/dumb/ActionButtonRow.vue'

const props = defineProps<{
  cardId: string
}>()

const emit = defineEmits<{
  (event: 'next'): void
  (event: 'followup-goals'): void
  (event: 'required-goals'): void
  (event: 'required-flashcards'): void
}>()

const flashcardsStore = useFlashcardsStore()
const progressStore = useProgressStore()

const card = computed(() =>
  flashcardsStore.flashcards.find((entry) => entry._id === props.cardId)
)

const stage = ref<'do' | 'result' | 'schedule' | 'next'>('do')
const wasSuccessful = ref<boolean | null>(null)
const isSaving = ref(false)

type ActionOption = { id: string; label: string; variant?: 'primary' | 'outline' | 'ghost'; disabled?: boolean }

const scheduleActions = computed<ActionOption[]>(() => [
  { id: 'no', label: 'No', variant: 'outline', disabled: isSaving.value },
  { id: 'year', label: 'In a Year', variant: 'outline', disabled: isSaving.value },
  { id: 'month', label: 'In a Month', variant: 'outline', disabled: isSaving.value },
  { id: 'week', label: 'In a Week', variant: 'outline', disabled: isSaving.value },
  { id: 'tomorrow', label: 'Tomorrow', variant: 'outline', disabled: isSaving.value },
  { id: 'asap', label: 'ASAP', variant: 'primary', disabled: isSaving.value }
])

const scheduleMap: Record<string, number> = {
  year: 365,
  month: 30,
  week: 7,
  tomorrow: 1,
  asap: 0
}

const handleSchedule = async (id: string) => {
  if (!card.value || wasSuccessful.value === null || isSaving.value) return
  isSaving.value = true
  try {
    const days = scheduleMap[id] ?? 0
    const nextAt = id === 'no' ? undefined : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
    await progressStore.updateProceduralProgress(card.value._id, {
      isAchieved: wasSuccessful.value,
      practiceNextAt: nextAt
    })
    await flashcardsStore.addLog(card.value._id, 'PRACTICED_GOAL')
    stage.value = 'next'
  } finally {
    isSaving.value = false
  }
}

const handleResult = (id: string) => {
  wasSuccessful.value = id === 'yes'
  stage.value = 'schedule'
}

const nextActions = computed<ActionOption[]>(() => {
  if (wasSuccessful.value) {
    return [
      { id: 'followup', label: 'Add Follow-Up Goals', variant: 'primary' },
      { id: 'next', label: 'Next', variant: 'outline' }
    ]
  }
  return [
    { id: 'required-goals', label: 'Add Required Goals', variant: 'primary' },
    { id: 'required-flashcards', label: 'Add Required Flashcards', variant: 'outline' },
    { id: 'next', label: 'Next', variant: 'outline' }
  ]
})

const handleNextAction = (id: string) => {
  if (id === 'followup') emit('followup-goals')
  else if (id === 'required-goals') emit('required-goals')
  else if (id === 'required-flashcards') emit('required-flashcards')
  else emit('next')
}
</script>

<template>
  <div class="w-full max-w-4xl space-y-6">
    <PracticeInstruction
      v-if="stage === 'do'"
      text="Do:"
    />
    <PracticeInstruction
      v-else-if="stage === 'result'"
      text="Did you succeed"
    />
    <PracticeInstruction
      v-else-if="stage === 'schedule'"
      text="Practice again?"
    />
    <PracticeInstruction
      v-else
      text="Next"
    />

    <div
      v-if="card"
      class="w-full"
    >
      <FlashcardRenderer
        :front="card.front"
        :back="card.back"
        :card-type="card.cardType"
        :show-back="false"
      />
    </div>

    <ActionButtonRow
      v-if="stage === 'do'"
      :actions="[{ id: 'done', label: 'Done', variant: 'primary' }]"
      @select="stage = 'result'"
    />

    <ActionButtonRow
      v-else-if="stage === 'result'"
      :actions="[
        { id: 'yes', label: 'Yes', variant: 'primary' },
        { id: 'no', label: 'No', variant: 'outline' }
      ]"
      @select="handleResult"
    />

    <ActionButtonRow
      v-else-if="stage === 'schedule'"
      :actions="scheduleActions"
      @select="handleSchedule"
    />

    <ActionButtonRow
      v-else
      :actions="nextActions"
      @select="handleNextAction"
    />
  </div>
</template>
