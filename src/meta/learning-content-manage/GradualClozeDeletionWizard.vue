<script setup lang="ts">
import { ref, watch } from 'vue'
import { createFlashcard } from '@/entities/flashcard/flashcardStore'
import { showToast } from '@/app/toast/toastStore'
import { CLOZE_MARKER } from './gradualClozeDeletionTypes'
import type { ClozeSelection, WizardPhase } from './gradualClozeDeletionTypes'

const props = defineProps<{
  open: boolean
  initialContent: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  complete: [lastCardId: string]
}>()

const phase = ref<WizardPhase>('confirm')
const baseContent = ref('')
const currentText = ref('')
const selections = ref<ClozeSelection[]>([])

watch(
  () => props.open,
  (newValue) => {
    if (newValue) {
      baseContent.value = props.initialContent
      currentText.value = props.initialContent
      selections.value = []
      phase.value = 'confirm'
    }
  }
)

const resetWizard = () => {
  baseContent.value = ''
  currentText.value = ''
  selections.value = []
  phase.value = 'confirm'
}

const handleCancel = () => {
  if (selections.value.length > 0) {
    if (!confirm('Are you sure? Progress will be lost.')) {
      return
    }
  }
  resetWizard()
  emit('update:open', false)
}

const handleConfirm = () => {
  if (!baseContent.value.trim()) {
    showToast('Base content cannot be empty', 'error')
    return
  }
  currentText.value = baseContent.value
  phase.value = 'select'
}

const captureSelection = () => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    showToast('Please select some text first', 'error')
    return null
  }

  const selectedText = selection.toString().trim()
  if (!selectedText) {
    showToast('Please select some text first', 'error')
    return null
  }

  const startOffset = currentText.value.indexOf(selectedText)
  if (startOffset === -1) {
    showToast('Selection must be from the displayed text', 'error')
    return null
  }

  return { text: selectedText, startOffset }
}

const handleNextSelection = () => {
  const selected = captureSelection()
  if (!selected) return

  const clozedVersion = currentText.value.replace(selected.text, CLOZE_MARKER)

  selections.value.push({
    text: selected.text,
    clozedVersion: clozedVersion,
  })

  currentText.value = clozedVersion

  window.getSelection()?.removeAllRanges()
}

const handleFinish = async () => {
  if (selections.value.length === 0) {
    showToast('No selections made', 'error')
    return
  }

  try {
    const cardIds: string[] = []

    for (let i = 0; i < selections.value.length; i++) {
      const selection = selections.value[i]
      if (!selection) continue

      const blockedBy = i === 0 ? [] : [cardIds[i - 1]!]

      const card = await createFlashcard(
        selection.clozedVersion,
        baseContent.value,
        blockedBy
      )

      cardIds.push(card.id)
    }

    const lastCardId = cardIds[cardIds.length - 1]
    if (!lastCardId) {
      showToast('Failed to create flashcards', 'error')
      return
    }

    emit('complete', lastCardId)
    emit('update:open', false)

    showToast(`Created ${selections.value.length} flashcards`, 'success')

    resetWizard()
  } catch (error) {
    showToast('Failed to create flashcards', 'error')
    console.error(error)
  }
}
</script>

<template>
  <dialog
    :open="props.open"
    class="modal"
  >
    <div class="modal-box">
      <div v-if="phase === 'confirm'">
        <h3 class="font-bold mb-4">
          Establish Gradual Cloze Deletion
        </h3>

        <fieldset class="fieldset">
          <label
            for="base-content"
            class="label"
          >Base Content</label>
          <textarea
            id="base-content"
            v-model="baseContent"
            class="textarea"
            rows="8"
          />
        </fieldset>

        <div class="modal-action">
          <button
            class="btn"
            @click="handleConfirm"
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

      <div v-else-if="phase === 'select'">
        <h3 class="font-bold mb-4">
          Select Text to Cloze
        </h3>

        <div class="mb-4">
          <p class="text-light mb-2">
            Select text with your mouse and click "Next Selection" to create a
            cloze deletion. Repeat to create progressive deletions.
          </p>
          <div
            class="p-4 bg-base-200 rounded"
            style="user-select: text"
          >
            {{ currentText }}
          </div>
        </div>

        <div
          v-if="selections.length > 0"
          class="mb-4"
        >
          <p class="text-light">
            Selections made: {{ selections.length }}
          </p>
        </div>

        <div class="modal-action">
          <button
            class="btn btn-primary"
            @click="handleFinish"
          >
            Finish
          </button>
          <button
            class="btn"
            @click="handleNextSelection"
          >
            Next Selection
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
