<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getOpenAIKey } from '@/app/storage/llmSettings'
import type { LearningGoalDoc } from '@/entities/learning-goals/LearningGoal'

type GeneratedGoal = {
  title: string
  content?: string
}

const props = defineProps<{
  open: boolean
  goal: LearningGoalDoc | null
  directChildren: LearningGoalDoc[]
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'accept', goals: GeneratedGoal[], generateAgain: boolean): void
}>()

const step = ref<'prompt' | 'results'>('prompt')
const prompt = ref('')
const autoPrompt = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const results = ref<GeneratedGoal[]>([])
const selected = ref<Set<number>>(new Set())

const goalTitle = computed(() => props.goal?.title ?? '')
const goalContent = computed(() => props.goal?.content ?? '')

const buildDefaultPrompt = () => {
  const childLines = props.directChildren.length
    ? props.directChildren.map((child) => `- ${child.title}`).join('\n')
    : ''
  const contentBlock = goalContent.value ? `\nContent:\n${goalContent.value}\n` : ''
  return [
    'You are helping break down a learning goal into concrete child goals.',
    'Create child learning goals that are specific and minimal.',
    'Limit to goals that consist of declarative knowledge and can be taught with text-based flashcards',
    'Formulate them with an actionable, meaningful verb in the beginning such as "Understand..." or "Know how..."',
    '',
    `Parent Goal: ${goalTitle.value}`,
    contentBlock,
    props.directChildren.length ? 'Child Goals already added:' : '',
    childLines,
    '',
    `Generate 3-5 new child goals.`
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
  selected.value = new Set(results.value.map((_goal, index) => index))
}

const parseGoals = (text: string): GeneratedGoal[] => {
  const parsed = JSON.parse(text) as { goals?: GeneratedGoal[] }
  if (!parsed.goals || !Array.isArray(parsed.goals)) return []
  return parsed.goals
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
            name: 'child_goals',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                goals: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      title: { type: 'string' },
                      content: { type: 'string' }
                    },
                    required: ['title', 'content']
                  }
                }
              },
              required: ['goals']
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
    results.value = parseGoals(text)
    selectAll()
    step.value = 'results'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to generate goals.'
  } finally {
    isLoading.value = false
  }
}

const selectedGoals = computed(() =>
  results.value.filter((_goal, index) => selected.value.has(index))
)

const accept = (generateAgain: boolean) => {
  emit('accept', selectedGoals.value, generateAgain)
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
          Generate Child Goals
        </h3>
        <p class="text-sm opacity-70">
          Use AI to suggest new child goals for this learning goal.
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
                <th>Title</th>
                <th>Content</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in results"
                :key="`${item.title}-${index}`"
              >
                <td>
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :checked="selected.has(index)"
                    @change="toggleSelection(index)"
                  >
                </td>
                <td class="font-medium">
                  {{ item.title }}
                </td>
                <td class="text-sm opacity-70">
                  {{ item.content || '—' }}
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
