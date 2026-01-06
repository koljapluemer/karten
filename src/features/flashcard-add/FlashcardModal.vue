<script setup lang="ts">
import { ref, watch } from 'vue'
import FlashcardForm from './FlashcardForm.vue'

const props = defineProps<{
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

const formKey = ref(0)

watch(
  () => props.open,
  (open) => {
    if (open) formKey.value += 1
  }
)
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
        :key="formKey"
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
