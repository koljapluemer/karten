<script setup lang="ts">
import { ref } from 'vue'
import FlashcardManager from '@/features/flashcard-manage/FlashcardManager.vue'
import { createFlashcard } from '@/entities/flashcard/flashcardStore'
import { showToast } from '@/app/toast/toastStore'
import type { FlashCardDoc } from '@/entities/flashcard/Flashcard'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  created: [flashcard: FlashCardDoc]
}>()

const front = ref('')
const back = ref('')
const instruction = ref('')
const blockedBy = ref<string[]>([])

const handleSave = async () => {
  const flashcard = await createFlashcard(front.value, back.value, instruction.value, blockedBy.value)
  showToast('Flashcard created', 'success')
  emit('created', flashcard)
  emit('close')
  front.value = ''
  back.value = ''
  instruction.value = ''
  blockedBy.value = []
}

const handleCancel = () => {
  emit('close')
}
</script>

<template>
  <dialog
    :open="open"
    class="modal"
  >
    <div class="modal-box max-w-4xl">
      <h2 class="text-xl font-bold mb-4">
        Add Flashcard
      </h2>

      <FlashcardManager
        v-if="open"
        v-model:front="front"
        v-model:back="back"
        v-model:instruction="instruction"
        v-model:blocked-by="blockedBy"
      />

      <div class="modal-action">
        <button
          class="btn btn-primary"
          @click="handleSave"
        >
          Save
        </button>
        <button
          class="btn"
          @click="handleCancel"
        >
          Cancel
        </button>
      </div>
    </div>
  </dialog>
</template>
