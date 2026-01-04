<script setup lang="ts">
import FlashcardForm from './FlashcardForm.vue'

defineProps<{
  open: boolean
  title: string
  submitLabel: string
  cardType?: 'declaritive' | 'procedural'
  initialFront?: string
  initialBack?: string
  isSaving?: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'save', value: { front: string; back: string }): void
}>()
</script>

<template>
  <dialog
    class="modal"
    :open="open"
    @close="emit('close')"
  >
    <div class="modal-box space-y-4">
      <h3 class="text-lg font-semibold">
        {{ title }}
      </h3>
      <FlashcardForm
        :submit-label="submitLabel"
        :card-type="cardType"
        :initial-front="initialFront"
        :initial-back="initialBack"
        :is-saving="isSaving"
        show-cancel
        @save="emit('save', $event)"
        @cancel="emit('close')"
      />
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
