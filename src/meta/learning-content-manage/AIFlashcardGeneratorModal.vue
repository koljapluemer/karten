<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getOpenAIKey } from '@/app/storage/openAIKey'
import { showToast } from '@/app/toast/toastStore'
import { createFlashcard } from '@/entities/flashcard/flashcardStore'
import { generateFlashcards } from '@/features/ai-flashcard-generate/openAIService'
import type { GeneratedCard, InstructionMode } from '@/features/ai-flashcard-generate/types'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'

const props = defineProps<{
  open: boolean
  content: string
}>()

const emit = defineEmits<{
  close: []
  accept: [cardIds: string[]]
}>()

const step = ref<'prompt' | 'results'>('prompt')
const prompt = ref('')
const instructionMode = ref<InstructionMode>('fixed')
const fixedInstruction = ref('Recall')
const isLoading = ref(false)
const error = ref<string | null>(null)
const results = ref<GeneratedCard[]>([])
const selected = ref<Set<number>>(new Set())

const buildPrompt = () => {
  if (instructionMode.value === 'fixed') {
    return `Based on the following learning content, generate 5 flashcards.
Each flashcard should have:
- front: a question or prompt
- back: the answer

Learning Content:
---
${props.content}
---

Generate exactly 5 flashcards that test understanding of key concepts.`
  } else {
    return `Based on the following learning content, generate 5 flashcards.
Each flashcard should have:
- front: a question or prompt
- back: the answer
- instruction: a brief instruction for the learner (e.g., "Recall", "Explain", "Define", "Compare")

Learning Content:
---
${props.content}
---

Generate exactly 5 flashcards that test understanding of key concepts.`
  }
}

const reset = () => {
  step.value = 'prompt'
  prompt.value = buildPrompt()
  results.value = []
  selected.value = new Set()
  error.value = null
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      const apiKey = getOpenAIKey()
      if (!apiKey) {
        showToast('Please set OpenAI API key in settings', 'error')
        emit('close')
        return
      }
      reset()
    }
  }
)

watch(
  [() => props.content, instructionMode],
  () => {
    if (props.open && step.value === 'prompt') {
      prompt.value = buildPrompt()
    }
  }
)

const toggleSelection = (index: number) => {
  const next = new Set(selected.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  selected.value = next
}

const selectAll = () => {
  selected.value = new Set(results.value.map((_item, index) => index))
}

const callOpenAI = async () => {
  const apiKey = getOpenAIKey()
  if (!apiKey) {
    showToast('Please set OpenAI API key in settings', 'error')
    emit('close')
    return
  }

  isLoading.value = true
  error.value = null

  try {
    results.value = await generateFlashcards(prompt.value, instructionMode.value)
    selectAll()
    step.value = 'results'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to generate cards.'
  } finally {
    isLoading.value = false
  }
}

const selectedCards = computed(() =>
  results.value.filter((_item, index) => selected.value.has(index))
)

const getCardInstruction = (card: GeneratedCard): string => {
  if (instructionMode.value === 'ai' && card.instruction) {
    return card.instruction
  }
  return fixedInstruction.value
}

const handleAccept = async () => {
  try {
    const cardIds: string[] = []
    for (const card of selectedCards.value) {
      const created = await createFlashcard(
        card.front,
        card.back,
        getCardInstruction(card),
        []
      )
      cardIds.push(created.id)
    }
    showToast(`Created ${cardIds.length} flashcards`, 'success')
    emit('accept', cardIds)
  } catch (err) {
    showToast('Failed to create flashcards', 'error')
    console.error(err)
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <dialog
    class="modal"
    :open="open"
  >
    <div class="modal-box max-w-4xl">
      <h3 class="text-lg font-semibold mb-4">
        AI Generate Flashcards
      </h3>

      <div
        v-if="step === 'prompt'"
        class="space-y-4"
      >
        <fieldset class="fieldset">
          <label class="label">
            <span class="label-text">Instruction mode</span>
          </label>
          <div class="flex flex-col gap-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="instructionMode"
                type="radio"
                name="instruction-mode"
                value="fixed"
                class="radio radio-sm"
              >
              <span>Use fixed instruction</span>
            </label>
            <input
              v-if="instructionMode === 'fixed'"
              v-model="fixedInstruction"
              type="text"
              class="input input-bordered input-sm ml-6 w-48"
              placeholder="e.g., Recall"
            >
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="instructionMode"
                type="radio"
                name="instruction-mode"
                value="ai"
                class="radio radio-sm"
              >
              <span>Let AI generate instructions</span>
            </label>
          </div>
        </fieldset>

        <fieldset class="fieldset">
          <label class="label">
            <span class="label-text">Prompt</span>
          </label>
          <textarea
            v-model="prompt"
            class="textarea textarea-bordered min-h-[200px] w-full"
          />
        </fieldset>

        <div
          v-if="error"
          class="text-sm text-error"
        >
          {{ error }}
        </div>

        <div class="modal-action">
          <button
            class="btn btn-primary"
            :disabled="isLoading"
            @click="callOpenAI"
          >
            {{ isLoading ? 'Generating...' : 'Generate' }}
          </button>
          <button
            class="btn btn-ghost"
            @click="handleClose"
          >
            Cancel
          </button>
        </div>
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <p class="text-sm opacity-70">
          {{ selectedCards.length }} of {{ results.length }} cards selected
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
          <div
            v-for="(card, index) in results"
            :key="`${card.front}-${index}`"
            class="relative"
          >
            <input
              type="checkbox"
              class="checkbox checkbox-sm absolute top-2 right-2 z-10"
              :checked="selected.has(index)"
              @change="toggleSelection(index)"
            >
            <div class="scale-90 origin-top-left pointer-events-none">
              <FlashcardRenderer
                :front="card.front"
                :back="card.back"
                :instruction="getCardInstruction(card)"
                :show-back="true"
              />
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button
            class="btn btn-primary"
            :disabled="selectedCards.length === 0"
            @click="handleAccept"
          >
            Accept ({{ selectedCards.length }})
          </button>
          <button
            class="btn btn-ghost"
            @click="handleClose"
          >
            Discard
          </button>
        </div>
      </div>
    </div>

    <form
      method="dialog"
      class="modal-backdrop"
      @click.prevent="handleClose"
    >
      <button aria-label="Close">
        close
      </button>
    </form>
  </dialog>
</template>
