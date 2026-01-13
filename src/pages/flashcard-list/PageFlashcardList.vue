<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Eye, Pencil, Trash2, Plus } from 'lucide-vue-next'
import { loadFlashcards, deleteFlashcard } from '@/entities/flashcard/flashcardStore'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'
import FlashcardAddModal from '@/features/flashcard-add/FlashcardAddModal.vue'
import FlashcardEditModal from '@/features/flashcard-edit/FlashcardEditModal.vue'
import type { FlashCardDoc } from '@/entities/flashcard/Flashcard'

const items = ref<FlashCardDoc[]>([])
const viewModalCard = ref<FlashCardDoc | null>(null)
const showViewModal = ref(false)
const showAddModal = ref(false)
const showEditModal = ref(false)
const editFlashcardId = ref<string | null>(null)

onMounted(async () => {
  items.value = await loadFlashcards()
})

const handleAdd = () => {
  showAddModal.value = true
}

const handleEdit = (id: string) => {
  editFlashcardId.value = id
  showEditModal.value = true
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

const closeViewModal = () => {
  showViewModal.value = false
}

const handleFlashcardCreated = async () => {
  items.value = await loadFlashcards()
}

const handleFlashcardUpdated = async () => {
  items.value = await loadFlashcards()
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
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleEdit(item.id)"
                >
                  <Pencil :size="16" />
                </button>
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

    <FlashcardAddModal
      :open="showAddModal"
      @close="showAddModal = false"
      @created="handleFlashcardCreated"
    />

    <FlashcardEditModal
      :open="showEditModal"
      :flashcard-id="editFlashcardId"
      @close="showEditModal = false"
      @updated="handleFlashcardUpdated"
    />
  </div>
</template>
