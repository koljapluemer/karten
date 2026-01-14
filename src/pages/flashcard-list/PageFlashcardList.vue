<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Eye, Pencil, Trash2, Plus } from 'lucide-vue-next'
import { loadFlashcards, deleteFlashcard, createFlashcard } from '@/entities/flashcard/flashcardStore'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'
import type { FlashCardDoc } from '@/entities/flashcard/Flashcard'
import JsonlUploadButton from './JsonlUploadButton.vue'
import { parseFlashcardsFromJsonl } from './importHelpers'

const items = ref<FlashCardDoc[]>([])
const viewModalCard = ref<FlashCardDoc | null>(null)
const showViewModal = ref(false)
const uploading = ref(false)

onMounted(async () => {
  items.value = await loadFlashcards()
})

const handleView = (card: FlashCardDoc) => {
  viewModalCard.value = card
  showViewModal.value = true
}

const handleDelete = async (id: string) => {
  if (!confirm('Delete this flashcard?')) return
  await deleteFlashcard(id)
  items.value = await loadFlashcards()
}

const closeViewModal = () => {
  showViewModal.value = false
}

const handleJsonlUpload = async (file: File) => {
  uploading.value = true
  try {
    const parsed = await parseFlashcardsFromJsonl(file)
    for (const item of parsed) {
      await createFlashcard(item.front, item.back, item.instruction)
    }
    items.value = await loadFlashcards()
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Flashcards
    </h1>

    <div class="flex gap-2 mb-4">
      <router-link
        to="/flashcards/add"
        class="btn btn-primary"
      >
        <Plus :size="20" />
        Add Flashcard
      </router-link>
      <JsonlUploadButton
        :loading="uploading"
        @file="handleJsonlUpload"
      />
    </div>

    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Front</th>
            <th>Back</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.id"
          >
            <td class="truncate max-w-md">
              {{ item.front }}
            </td>
            <td class="truncate max-w-md">
              {{ item.back }}
            </td>
            <td>
              <div class="flex gap-2">
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleView(item)"
                >
                  <Eye :size="16" />
                </button>
                <router-link
                  :to="`/flashcards/${item.id}/edit`"
                  class="btn btn-sm btn-ghost"
                >
                  <Pencil :size="16" />
                </router-link>
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleDelete(item.id)"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog
      :open="showViewModal"
      class="modal"
    >
      <div class="modal-box">
        <FlashcardRenderer
          v-if="viewModalCard"
          :front="viewModalCard.front"
          :back="viewModalCard.back"
          :instruction="viewModalCard.instruction"
          :show-back="true"
        />
        <div class="modal-action">
          <button
            class="btn"
            @click="closeViewModal"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>
