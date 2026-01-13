<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import FlashcardFormEdit from '@/entities/flashcard/FlashcardFormEdit.vue'
import { getFlashcardById, updateFlashcard } from '@/entities/flashcard/flashcardStore'

const router = useRouter()
const route = useRoute()

const front = ref('')
const back = ref('')
const instruction = ref('')
const blockedBy = ref<string[]>([])
const notFound = ref(false)

onMounted(async () => {
  const id = route.params.id as string
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
})

const handleBlur = async () => {
  const id = route.params.id as string
  if (!id) return
  await updateFlashcard(id, front.value, back.value, instruction.value, blockedBy.value)
}

const handleClose = () => {
  const returnTo = route.query.returnTo as string || '/flashcards'
  router.push(returnTo)
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
        class="btn btn-outline mt-4"
        @click="handleClose"
      >
        Back
      </button>
    </div>

    <div v-else>
      <FlashcardFormEdit
        v-model:front="front"
        v-model:back="back"
        v-model:instruction="instruction"
        v-model:blocked-by="blockedBy"
        @blur="handleBlur"
      />

      <div class="flex gap-2 mt-4">
        <button
          class="btn btn-outline"
          @click="handleClose"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
