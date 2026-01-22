<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Eye, Pencil, Trash2, Plus } from 'lucide-vue-next'
import { loadFlashcards, deleteFlashcard, createFlashcard } from '@/entities/flashcard/flashcardStore'
import { loadTags, getOrCreateTag } from '@/entities/tag/tagStore'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'
import TagFilter, { type TagFilterMode } from '@/features/tag-filter/TagFilter.vue'
import type { FlashCard } from '@/db/Flashcard'
import type { Tag } from '@/db/Tag'
import JsonlUploadButton from './JsonlUploadButton.vue'
import { parseFlashcardsFromJsonl } from './importHelpers'

const items = ref<FlashCard[]>([])
const allTags = ref<Tag[]>([])
const filterTags = ref<string[]>([])
const filterMode = ref<TagFilterMode>('any')
const viewModalCard = ref<FlashCard | null>(null)
const showViewModal = ref(false)
const uploading = ref(false)

const viewModalTags = computed(() => {
  if (!viewModalCard.value) return []
  const tagIds = viewModalCard.value.tags ?? []
  return allTags.value.filter(tag => tagIds.includes(tag.id))
})

onMounted(async () => {
  items.value = await loadFlashcards()
  allTags.value = await loadTags()
})

const filteredItems = computed(() => {
  if (filterTags.value.length === 0) {
    return items.value
  }

  return items.value.filter(item => {
    const itemTags = item.tags ?? []
    if (filterMode.value === 'any') {
      return filterTags.value.some(tagId => itemTags.includes(tagId))
    } else if (filterMode.value === 'all') {
      return filterTags.value.every(tagId => itemTags.includes(tagId))
    } else {
      return !filterTags.value.some(tagId => itemTags.includes(tagId))
    }
  })
})

const handleView = (card: FlashCard) => {
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
      const tagIds: string[] = []
      if (item.tags) {
        for (const tagContent of item.tags) {
          const tag = await getOrCreateTag(tagContent)
          tagIds.push(tag.id)
        }
      }
      await createFlashcard(item.front, item.back, [], tagIds)
    }
    items.value = await loadFlashcards()
    allTags.value = await loadTags()
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
        <Plus />
        Add Flashcard
      </router-link>
      <JsonlUploadButton
        :loading="uploading"
        @file="handleJsonlUpload"
      />
    </div>

    <div
      v-if="allTags.length > 0"
      class="mb-4"
    >
      <TagFilter
        v-model:selected-tags="filterTags"
        v-model:mode="filterMode"
        :all-tags="allTags"
      />
    </div>

    <table class="table w-full table-fixed">
      <thead>
        <tr>
          <th class="w-2/5">Front</th>
          <th class="w-2/5">Back</th>
          <th class="w-1/5">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in filteredItems"
          :key="item.id"
        >
          <td class="truncate">
            {{ item.front }}
          </td>
          <td class="truncate">
            {{ item.back }}
          </td>
            <td>
              <div class="flex gap-2">
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleView(item)"
                >
                  <Eye />
                </button>
                <router-link
                  :to="`/flashcards/${item.id}/edit`"
                  class="btn btn-sm btn-ghost"
                >
                  <Pencil />
                </router-link>
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleDelete(item.id)"
                >
                  <Trash2 />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
    </table>

    <dialog
      :open="showViewModal"
      class="modal"
    >
      <div class="modal-box">
        <FlashcardRenderer
          v-if="viewModalCard"
          :front="viewModalCard.front"
          :back="viewModalCard.back"
          :show-back="true"
          :tags="viewModalTags"
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
