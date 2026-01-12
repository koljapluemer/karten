<script setup lang="ts">
import { ref, watch } from 'vue'
import { getFlashcardById, updateFlashcard } from '@/entities/flashcard/flashcardStore'
import type { FlashCardDoc } from '@/entities/flashcard/Flashcard'
import FlashcardManager from '@/entities/flashcard/FlashcardManager.vue';

const props = defineProps<{
  open: boolean
  flashcardId: string | null
}>()

const emit = defineEmits<{
  close: []
  updated: [flashcard: FlashCardDoc]
}>()

const front = ref('')
const back = ref('')
const instruction = ref('')
const blockedBy = ref<string[]>([])
const notFound = ref(false)

watch(
  () => props.flashcardId,
  async (id) => {
    if (!id || !props.open) return
    try {
      const flashcard = await getFlashcardById(id)
      front.value = flashcard.front
      back.value = flashcard.back
      instruction.value = flashcard.instruction
      blockedBy.value = flashcard.blockedBy
      notFound.value = false
    } catch {
      notFound.value = true
    }
  },
  { immediate: true }
)

const handleBlur = async () => {
  if (!props.flashcardId) return
  await updateFlashcard(props.flashcardId, front.value, back.value, instruction.value, blockedBy.value)
  const updated = await getFlashcardById(props.flashcardId)
  emit('updated', updated)
}

const handleClose = () => {
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
        Edit Flashcard
      </h2>

      <div v-if="notFound">
        <p>Flashcard not found.</p>
      </div>

      <div v-else>
        <FlashcardManager
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
    </div>
  </dialog>
</template>
