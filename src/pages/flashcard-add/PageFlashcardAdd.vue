<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import FlashcardManager from '@/features/flashcard-manage/FlashcardManager.vue'
import { createFlashcard } from '@/entities/flashcard/flashcardStore'

const router = useRouter()
const front = ref('')
const back = ref('')
const instruction = ref('')

const handleSave = async () => {
  await createFlashcard(front.value, back.value, instruction.value)
  router.push('/flashcards')
}

const handleCancel = () => {
  router.push('/flashcards')
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Add Flashcard
    </h1>

    <FlashcardManager
      v-model:front="front"
      v-model:back="back"
      v-model:instruction="instruction"
    />

    <div class="flex gap-2 mt-4">
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
</template>
