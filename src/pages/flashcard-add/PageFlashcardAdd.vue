<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import FlashcardFormAdd from '@/entities/flashcard/FlashcardFormAdd.vue'
import { createFlashcard } from '@/entities/flashcard/flashcardStore'
import { showToast } from '@/app/toast/toastStore'

const router = useRouter()
const route = useRoute()

const front = ref('')
const back = ref('')
const frontMediaIds = ref<string[]>([])
const backMediaIds = ref<string[]>([])

const handleSave = async () => {
  if (!front.value.trim() || !back.value.trim()) {
    showToast('Front and back are required', 'error')
    return
  }

  const flashcard = await createFlashcard(front.value, back.value, [], frontMediaIds.value, backMediaIds.value)

  showToast('Flashcard created', 'success')

  const returnTo = route.query.returnTo as string || '/flashcards'

  // Append createdId to returnTo URL if navigation came from a context that needs it
  const context = route.query.context as string
  if (context && flashcard.id) {
    const url = new URL(returnTo, window.location.origin)
    url.searchParams.set('createdId', flashcard.id)

    // Pass through attachToParentId if it was provided (for prerequisite creation)
    const attachToParentId = route.query.attachToParentId as string
    if (attachToParentId) {
      url.searchParams.set('attachToParentId', attachToParentId)
    }

    router.push(url.pathname + url.search)
  } else {
    router.push(returnTo)
  }
}

const handleSaveAndAddAnother = async () => {
  if (!front.value.trim() || !back.value.trim()) {
    showToast('Front and back are required', 'error')
    return
  }

  await createFlashcard(front.value, back.value, [], frontMediaIds.value, backMediaIds.value)
  showToast('Flashcard created', 'success')

  // Reset form for new entry
  front.value = ''
  back.value = ''
  frontMediaIds.value = []
  backMediaIds.value = []
}

const handleCancel = () => {
  showToast('Cancelled', 'info')
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
      v-model:front-media-ids="frontMediaIds"
      v-model:back-media-ids="backMediaIds"
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
        @click="handleSaveAndAddAnother"
      >
        Save & Add Another
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
