```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getOpenAIKey } from '@/app/storage/openAIKey'
import OpenAIKeyModal from './OpenAIKeyModal.vue'

type GeneratedCard = {
  front: string
  back?: string
}

const props = defineProps<{
  open: boolean
  title: string
  description?: string
  defaultPrompt: string
  cardType: 'declaritive' | 'procedural'
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'accept', cards: GeneratedCard[], generateAgain: boolean): void
}>()

const step = ref<'prompt' | 'results'>('prompt')
const prompt = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const results = ref<GeneratedCard[]>([])
const selected = ref<Set<number>>(new Set())
const isKeyModalOpen = ref(false)

const reset = () => {
  step.value = 'prompt'
  prompt.value = props.defaultPrompt
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

watch(
  () => props.defaultPrompt,
  (next) => {
    if (props.open && step.value === 'prompt') {
      prompt.value = next
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

const parseCards = (text: string): GeneratedCard[] => {
  const parsed = JSON.parse(text) as { cards?: GeneratedCard[] }
  if (!parsed.cards || !Array.isArray(parsed.cards)) return []
  if (props.cardType === 'procedural') {
    return parsed.cards.filter((card) => card.front && card.front.trim().length > 0)
  }
  return parsed.cards.filter(
    (card) => card.front && card.front.trim().length > 0 && card.back && card.back.trim().length > 0
  )
}

const buildSchema = () => {
  const itemProperties = props.cardType === 'procedural'
    ? { front: { type: 'string' } }
    : { front: { type: 'string' }, back: { type: 'string' } }
  const requiredFields = props.cardType === 'procedural' ? ['front'] : ['front', 'back']

  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      cards: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: itemProperties,
          required: requiredFields
        }
      }
    },
    required: ['cards']
  }
}

const callOpenAI = async () => {
  const apiKey = getOpenAIKey()
  if (!apiKey) {
    error.value = 'Missing OpenAI API key.'
    isKeyModalOpen.value = true
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
            content: 'Return only JSON that matches the provided schema. No extra commentary.'
          },
          {
            role: 'user',
            content: prompt.value
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'generated_cards',
            strict: true,
            schema: buildSchema()
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
    error.value = err instanceof Error ? err.message : 'Failed to generate cards.'
  } finally {
    isLoading.value = false
  }
}

const selectedCards = computed(() =>
  results.value.filter((_item, index) => selected.value.has(index))
)

const accept = (generateAgain: boolean) => {
  emit('accept', selectedCards.value, generateAgain)
  if (generateAgain) {
    step.value = 'prompt'
    results.value = []
    selected.value = new Set()
    error.value = null
  }
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
          {{ title }}
        </h3>
        <p
          v-if="description"
          class="text-sm opacity-70"
        >
          {{ description }}
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
                <th v-if="cardType === 'declaritive'">
                  Back
                </th>
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
                <td class="whitespace-pre-wrap">
                  {{ item.front }}
                </td>
                <td
                  v-if="cardType === 'declaritive'"
                  class="whitespace-pre-wrap text-sm opacity-70"
                >
                  {{ item.back || '—' }}
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

  <OpenAIKeyModal
    :open="isKeyModalOpen"
    @close="isKeyModalOpen = false"
    @saved="isKeyModalOpen = false"
  />
</template>
```