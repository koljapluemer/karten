<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getOpenAIKey } from '@/app/storage/openAIKey'
import { showToast } from '@/app/toast/toastStore'
import { createFlashcard } from '@/entities/flashcard/flashcardStore'
import { generateFlashcards } from '@/features/ai-flashcard-generate/openAIService'
import type { GeneratedCard } from '@/features/ai-flashcard-generate/types'
import type { FlashCard } from '@/db/Flashcard'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'
import PromptSelector from '@/features/prompt-select/PromptSelector.vue'

const props = defineProps<{
  open: boolean
  card: FlashCard
}>()

const emit = defineEmits<{
  close: []
  accept: [cardIds: string[]]
}>()

const step = ref<'prompt' | 'results'>('prompt')
const currentPrompt = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const results = ref<GeneratedCard[]>([])
const selected = ref<Set<number>>(new Set())

const magicValues = computed(() => ({
  flashcard: `${props.card.front}\n---\n${props.card.back}`,
  front: props.card.front,
  back: props.card.back
}))

const reset = () => {
  step.value = 'prompt'
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

const handlePromptChange = (prompt: string) => {
  currentPrompt.value = prompt
}

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
    results.value = await generateFlashcards(currentPrompt.value)
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

const handleAccept = async () => {
  try {
    const cardIds: string[] = []
    for (const card of selectedCards.value) {
      const created = await createFlashcard(
        card.front,
        card.back,
        []
      )
      cardIds.push(created.id)
    }
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
        Generate Previous Knowledge Flashcards
      </h3>

      <div
        v-if="step === 'prompt'"
        class="space-y-4"
      >
        <PromptSelector
          :magic-values="magicValues"
          context="previous-knowledge"
          @prompt-change="handlePromptChange"
        />

        <div
          v-if="error"
          class="text-sm text-error"
        >
          {{ error }}
        </div>

        <div class="modal-action">
          <button
            class="btn btn-primary"
            :disabled="isLoading || !currentPrompt"
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
            v-for="(generatedCard, index) in results"
            :key="`${generatedCard.front}-${index}`"
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
                :front="generatedCard.front"
                :back="generatedCard.back"
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
