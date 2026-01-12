<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import FlashcardManager from '@/features/flashcard-manage/FlashcardManager.vue'
import { getFlashcardById, updateFlashcard } from '@/entities/flashcard/flashcardStore'

const router = useRouter()
const route = useRoute()
const front = ref('')
const back = ref('')
const instruction = ref('')
const notFound = ref(false)

onMounted(async () => {
  const id = route.params.id as string
  try {
    const item = await getFlashcardById(id)
    front.value = item.front
    back.value = item.back
    instruction.value = item.instruction
  } catch {
    notFound.value = true
  }
})

const handleSave = async () => {
  const id = route.params.id as string
  await updateFlashcard(id, front.value, back.value, instruction.value)
  router.push('/flashcards')
}

const handleCancel = () => {
  router.push('/flashcards')
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Edit Flashcard
    </h1>

    <div v-if="notFound">
      <p>Flashcard not found.</p>
      <button
        class="btn mt-4"
        @click="handleCancel"
      >
        Back to List
      </button>
    </div>

    <div v-else>
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
  </div>
</template>
