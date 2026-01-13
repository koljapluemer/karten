<script setup lang="ts">
import { ref } from 'vue'
import { createFlashcard, updateFlashcard, getFlashcardById } from '@/entities/flashcard/flashcardStore'
import type { FlashCardDoc } from '@/entities/flashcard/Flashcard'
import FlashcardManager from '@/entities/flashcard/FlashcardManager.vue';

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
const createdId = ref<string | null>(null)

const handleBlur = async () => {
  if (!createdId.value) {
    const flashcard = await createFlashcard(front.value, back.value, instruction.value, blockedBy.value)
    createdId.value = flashcard.id
  } else {
    await updateFlashcard(createdId.value, front.value, back.value, instruction.value, blockedBy.value)
  }
}

const handleClose = async () => {
  if (createdId.value) {
    const flashcard = await getFlashcardById(createdId.value)
    emit('created', flashcard)
  }
  emit('close')
  front.value = ''
  back.value = ''
  instruction.value = ''
  blockedBy.value = []
  createdId.value = null
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
        @blur="handleBlur"
      />

      <div class="modal-action">
        <button
          class="btn"
          @click="handleClose"
        >
          Close
        </button>
      </div>
    </div>
  </dialog>
</template>
