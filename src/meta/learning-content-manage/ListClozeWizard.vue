<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { createFlashcard, updateFlashcard } from '@/entities/flashcard/flashcardStore'
import { showToast } from '@/app/toast/toastStore'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'
import {
  detectListItems,
  generateClozeFront,
  generateSubsets,
  maxCombinations,
  buildBlockedByTiers,
} from './listClozeGeneration'

const props = defineProps<{
  open: boolean
  initialContent: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  complete: [topCardId: string]
}>()

type Phase = 'input' | 'configure'

const phase = ref<Phase>('input')
const textContent = ref('')
const cardCount = ref(1)
const generatedSubsets = ref<Set<number>[]>([])

watch(
  () => props.open,
  (newValue) => {
    if (newValue) {
      textContent.value = props.initialContent
      phase.value = 'input'
      cardCount.value = 1
      generatedSubsets.value = []
    }
  },
)

const detectedItems = computed(() => detectListItems(textContent.value))

const maxCards = computed(() => {
  const n = detectedItems.value.length
  if (n === 0) return 0
  return maxCombinations(n)
})

const cards = computed(() =>
  generatedSubsets.value.map((subset) => ({
    front: generateClozeFront(textContent.value, detectedItems.value, subset),
    back: textContent.value,
    clozeCount: subset.size,
  })),
)

const regenerateSubsets = () => {
  generatedSubsets.value = generateSubsets(
    detectedItems.value.length,
    cardCount.value,
  )
}

const handleNext = () => {
  if (detectedItems.value.length < 2) {
    showToast('Need at least 2 list items', 'error')
    return
  }
  cardCount.value = Math.min(detectedItems.value.length, maxCards.value)
  regenerateSubsets()
  phase.value = 'configure'
}

const handleCardCountChange = (event: Event) => {
  const value = parseInt((event.target as HTMLInputElement).value, 10)
  cardCount.value = value
  regenerateSubsets()
}

const handleReroll = () => {
  regenerateSubsets()
}

const resetWizard = () => {
  textContent.value = ''
  phase.value = 'input'
  cardCount.value = 1
  generatedSubsets.value = []
}

const handleCancel = () => {
  if (phase.value === 'configure') {
    if (!confirm('Are you sure? Progress will be lost.')) {
      return
    }
  }
  resetWizard()
  emit('update:open', false)
}

const isCreating = ref(false)

const handleCreate = async () => {
  if (cards.value.length === 0) return

  isCreating.value = true
  try {
    const createdCards: { id: string; front: string; back: string; clozeCount: number }[] = []

    for (const card of cards.value) {
      const created = await createFlashcard(card.front, card.back, [])
      createdCards.push({ id: created.id, front: card.front, back: card.back, clozeCount: card.clozeCount })
    }

    const blockedByMap = buildBlockedByTiers(createdCards)

    for (const card of createdCards) {
      const blockedBy = blockedByMap.get(card.id) ?? []
      if (blockedBy.length > 0) {
        await updateFlashcard(
          card.id,
          card.front,
          card.back,
          blockedBy,
        )
      }
    }

    const topCard = createdCards.reduce((a, b) =>
      a.clozeCount >= b.clozeCount ? a : b,
    )

    emit('complete', topCard.id)
    emit('update:open', false)
    showToast(`Created ${createdCards.length} list cloze flashcards`, 'success')
    resetWizard()
  } catch (error) {
    showToast('Failed to create flashcards', 'error')
    console.error(error)
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <dialog
    :open="props.open"
    class="modal"
  >
    <div class="modal-box max-w-4xl">
      <div v-if="phase === 'input'">
        <h3 class="font-bold mb-4">
          Generate List Cloze Flashcards
        </h3>

        <p class="text-sm opacity-70 mb-4">
          Include the list title/prompt. Format list items as a markdown numbered or unnumbered list.
        </p>

        <fieldset class="fieldset">
          <label
            for="list-cloze-content"
            class="label"
          >Content</label>
          <textarea
            id="list-cloze-content"
            v-model="textContent"
            class="textarea"
            rows="10"
          />
        </fieldset>

        <div class="mt-4">
          <p
            v-if="detectedItems.length === 0"
            class="text-sm opacity-70"
          >
            No list detected
          </p>
          <div v-else>
            <p class="text-sm opacity-70 mb-2">
              Detected {{ detectedItems.length }} items:
            </p>
            <ul class="list-disc list-inside text-sm">
              <li
                v-for="item in detectedItems"
                :key="item.index"
              >
                {{ item.itemText }}
              </li>
            </ul>
          </div>
        </div>

        <div class="modal-action">
          <button
            class="btn"
            :disabled="detectedItems.length < 2"
            @click="handleNext"
          >
            Next
          </button>
          <button
            class="btn btn-ghost"
            @click="handleCancel"
          >
            Cancel
          </button>
        </div>
      </div>

      <div v-else-if="phase === 'configure'">
        <h3 class="font-bold mb-4">
          Configure List Cloze Cards
        </h3>

        <p class="text-sm opacity-70 mb-4">
          {{ detectedItems.length }} items detected. Generating flashcards.
        </p>

        <div class="flex items-center gap-4 mb-4">
          <label
            for="card-count-slider"
            class="text-sm whitespace-nowrap"
          >Cards: {{ cardCount }}</label>
          <input
            id="card-count-slider"
            type="range"
            class="range range-sm flex-1"
            :min="1"
            :max="maxCards"
            :value="cardCount"
            @input="handleCardCountChange"
          >
          <button
            class="btn btn-sm btn-ghost"
            @click="handleReroll"
          >
            Reroll
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
          <div
            v-for="(card, index) in cards"
            :key="index"
            class="relative"
          >
            <div class="scale-90 origin-top-left pointer-events-none">
              <FlashcardRenderer
                :front="card.front"
                :back="card.back"
                :show-back="true"
              />
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button
            class="btn btn-primary"
            :disabled="isCreating || cards.length === 0"
            @click="handleCreate"
          >
            {{ isCreating ? 'Creating...' : `Create (${cards.length})` }}
          </button>
          <button
            class="btn btn-ghost"
            @click="handleCancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </dialog>
</template>
