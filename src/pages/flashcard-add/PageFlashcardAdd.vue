<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import FlashcardFormAdd from '@/entities/flashcard/FlashcardFormAdd.vue'
import { createFlashcard } from '@/entities/flashcard/flashcardStore'
import { addInstructionToHistory } from '@/entities/flashcard/instructionHistory'
import { showToast } from '@/app/toast/toastStore'

const router = useRouter()
const route = useRoute()

const front = ref('')
const back = ref('')
const instruction = ref('')

const handleSave = async () => {
  if (!front.value.trim() || !back.value.trim()) {
    showToast('Front and back are required', 'error')
    return
  }

  await createFlashcard(front.value, back.value, instruction.value, [])

  if (instruction.value.trim()) {
    addInstructionToHistory(instruction.value)
  }

  showToast('Flashcard created', 'success')

  const returnTo = route.query.returnTo as string || '/flashcards'
  router.push(returnTo)
}

const handleCancel = () => {
  const returnTo = route.query.returnTo as string || '/flashcards'
  router.push(returnTo)
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Add Flashcard
    </h1>

    <FlashcardFormAdd
      v-model:front="front"
      v-model:back="back"
      v-model:instruction="instruction"
    />

    <div class="flex gap-2 mt-4">
      <button
        class="btn btn-outline"
        @click="handleSave"
      >
        Save
      </button>
      <button
        class="btn btn-outline"
        @click="handleCancel"
      >
        Cancel
      </button>
    </div>
  </div>
</template>
