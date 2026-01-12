<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, Pencil, Trash2, Plus } from 'lucide-vue-next'
import { loadFlashcards, deleteFlashcard } from '@/entities/flashcard/flashcardStore'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'
import type { FlashCardDoc } from '@/entities/flashcard/Flashcard'

const router = useRouter()
const items = ref<FlashCardDoc[]>([])
const viewModalCard = ref<FlashCardDoc | null>(null)
const showViewModal = ref(false)

onMounted(async () => {
  items.value = await loadFlashcards()
})

const handleAdd = () => {
  router.push('/flashcards/add')
}

const handleEdit = (id: string) => {
  router.push(`/flashcards/${id}/edit`)
}

const handleView = (card: FlashCardDoc) => {
  viewModalCard.value = card
  showViewModal.value = true
}

const handleDelete = async (id: string) => {
  if (!confirm('Delete this flashcard?')) return
  await deleteFlashcard(id)
  items.value = await loadFlashcards()
}

const closeModal = () => {
  showViewModal.value = false
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Flashcards
    </h1>

    <button
      class="btn btn-primary mb-4"
      @click="handleAdd"
    >
      <Plus :size="20" />
      Add Flashcard
    </button>

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
            :key="item._id"
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
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleEdit(item._id)"
                >
                  <Pencil :size="16" />
                </button>
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleDelete(item._id)"
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
            @click="closeModal"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>
