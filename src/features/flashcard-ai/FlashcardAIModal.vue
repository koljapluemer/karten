<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getOpenAIKey } from '@/app/storage/llmSettings'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import type { LearningGoalDoc } from '@/entities/learning-goals/LearningGoal'

type GeneratedFlashcard = {
  front: string
  back: string
}

const props = defineProps<{
  open: boolean
  goal: LearningGoalDoc | null
  attachedFlashcards: FlashCardDoc[]
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'accept', cards: GeneratedFlashcard[], generateAgain: boolean): void
}>()

const step = ref<'prompt' | 'results'>('prompt')
const prompt = ref('')
const autoPrompt = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const results = ref<GeneratedFlashcard[]>([])
const selected = ref<Set<number>>(new Set())

const goalTitle = computed(() => props.goal?.title ?? '')
const goalContent = computed(() => props.goal?.content ?? '')

const buildDefaultPrompt = () => {
  const flashcardLines = props.attachedFlashcards.length
    ? props.attachedFlashcards
        .map((card) => `- Front: ${card.front}`)
        .join('\n')
    : ''
  const contentBlock = goalContent.value ? `\nGoal Details Description:\n${goalContent.value}\n` : ''
  return [
    'You are generating flashcards for a learning goal.',
    'Each flashcard must be short, focused, and factual.',
    'Use markdown where appropriate.',
    'Utilize a cloze format, e.g. front: "The capital of France is __", back: "Paris"',
    '',
    `Goal title: **${goalTitle.value}**`,
    contentBlock,
    props.attachedFlashcards.length ? 'Existing flashcards:' : '',
    flashcardLines,
    '',
    `Generate 3-10 new flashcards with front and back.`
  ]
    .filter((line) => line !== '')
    .join('\n')
}

const reset = () => {
  step.value = 'prompt'
  autoPrompt.value = buildDefaultPrompt()
  prompt.value = autoPrompt.value
  results.value = []
  selected.value = new Set()
  error.value = null
}

watch(
  () => props.open,
  (open) => {
    if (open) reset()
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
  selected.value = new Set(results.value.map((_card, index) => index))
}

const parseCards = (text: string): GeneratedFlashcard[] => {
  const parsed = JSON.parse(text) as { cards?: GeneratedFlashcard[] }
  if (!parsed.cards || !Array.isArray(parsed.cards)) return []
  return parsed.cards
}

const callOpenAI = async () => {
  const apiKey = getOpenAIKey()
  if (!apiKey) {
    error.value = 'Missing OpenAI API key.'
    return
  }
  isLoading.value = true
  error.value = null
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Return only JSON that matches the provided schema. No extra commentary.'
          },
          {
            role: 'user',
            content: prompt.value
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'flashcard_generation',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                cards: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      front: { type: 'string' },
                      back: { type: 'string' }
                    },
                    required: ['front', 'back']
                  }
                }
              },
              required: ['cards']
            }
          }
        }
      })
    })

    const data = await response.json()
    if (!response.ok) {
      const message = data?.error?.message || 'OpenAI error.'
      throw new Error(`${message} (${response.status})`)
    }
    const text = data?.choices?.[0]?.message?.content ?? ''
    if (!text) throw new Error('No response content.')
    results.value = parseCards(text)
    selectAll()
    step.value = 'results'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to generate flashcards.'
  } finally {
    isLoading.value = false
  }
}

const selectedCards = computed(() =>
  results.value.filter((_card, index) => selected.value.has(index))
)

const accept = (generateAgain: boolean) => {
  emit('accept', selectedCards.value, generateAgain)
}
</script>

<template>
  <dialog
    class="modal"
    :open="open"
    @close="emit('close')"
  >
    <div class="modal-box space-y-5">
      <div class="space-y-1">
        <h3 class="text-lg font-semibold">
          Generate Flashcards
        </h3>
        <p class="text-sm opacity-70">
          Use AI to suggest new flashcards for this goal.
        </p>
      </div>

      <div
        v-if="step === 'prompt'"
        class="space-y-4"
      >
        <div class="form-control">
          <label class="label">
            <span class="label-text">Prompt</span>
          </label>
          <textarea
            v-model="prompt"
            class="textarea textarea-bordered min-h-[160px]"
          />
        </div>

        <div
          v-if="error"
          class="text-sm text-error"
        >
          {{ error }}
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            class="btn btn-ghost"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            :disabled="isLoading"
            @click="callOpenAI"
          >
            {{ isLoading ? 'Generating...' : 'Generate' }}
          </button>
        </div>
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th />
                <th>Front</th>
                <th>Back</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in results"
                :key="`${item.front}-${index}`"
              >
                <td>
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :checked="selected.has(index)"
                    @change="toggleSelection(index)"
                  >
                </td>
                <td class="max-w-xs truncate font-medium">
                  {{ item.front }}
                </td>
                <td class="max-w-xs truncate text-sm opacity-70">
                  {{ item.back }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <button
            class="btn btn-ghost"
            @click="emit('close')"
          >
            Discard All
          </button>
          <div class="flex flex-col gap-2 sm:flex-row">
            <button
              class="btn btn-outline"
              @click="accept(true)"
            >
              Accept and Generate Again
            </button>
            <button
              class="btn btn-primary"
              @click="accept(false)"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
      @click.prevent="emit('close')"
    >
      <button aria-label="Close">
        close
      </button>
    </form>
  </dialog>
</template>
