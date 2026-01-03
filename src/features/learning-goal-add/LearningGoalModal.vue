<script setup lang="ts">
import LearningGoalForm from './LearningGoalForm.vue'

defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  formKey: number
  initialTitle?: string
  initialContent?: string
  isSaving?: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'save', value: { title: string; content: string }): void
}>()
</script>

<template>
  <dialog
    class="modal"
    :open="open"
    @close="emit('close')"
  >
    <div class="modal-box">
      <LearningGoalForm
        :key="formKey"
        :mode="mode"
        :initial-title="initialTitle"
        :initial-content="initialContent"
        :is-saving="isSaving"
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
