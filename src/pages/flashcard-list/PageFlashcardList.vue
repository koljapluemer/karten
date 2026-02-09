<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Eye, Pencil, Trash2, Plus, CheckSquare, Square } from 'lucide-vue-next'
import { loadFlashcards, deleteFlashcard, createFlashcard, updateFlashcard } from '@/entities/flashcard/flashcardStore'
import { cleanupOrphanedMedia } from '@/entities/media/mediaCleanup'
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
const selectedIds = ref<Set<string>>(new Set())

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

const allSelected = computed(() => {
  return filteredItems.value.length > 0 && filteredItems.value.every(item => selectedIds.value.has(item.id))
})

const someSelected = computed(() => selectedIds.value.size > 0)

const toggleSelect = (id: string) => {
  const newSet = new Set(selectedIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  selectedIds.value = newSet
}

const selectAll = () => {
  selectedIds.value = new Set(filteredItems.value.map(item => item.id))
}

const deselectAll = () => {
  selectedIds.value = new Set()
}

const handleDeleteSelected = async () => {
  if (selectedIds.value.size === 0) return
  if (!confirm(`Delete ${selectedIds.value.size} flashcard(s)?`)) return
  const mediaToCleanup: string[] = []
  for (const id of selectedIds.value) {
    const card = items.value.find(c => c.id === id)
    if (card) {
      mediaToCleanup.push(...(card.frontMediaIds ?? []), ...(card.backMediaIds ?? []))
    }
    await deleteFlashcard(id)
  }
  selectedIds.value = new Set()
  items.value = await loadFlashcards()
  await cleanupOrphanedMedia(mediaToCleanup)
}

const handleView = (card: FlashCard) => {
  viewModalCard.value = card
  showViewModal.value = true
}

const handleDelete = async (id: string) => {
  if (!confirm('Delete this flashcard?')) return
  const card = items.value.find(c => c.id === id)
  const mediaToCleanup = [...(card?.frontMediaIds ?? []), ...(card?.backMediaIds ?? [])]
  await deleteFlashcard(id)
  items.value = await loadFlashcards()
  await cleanupOrphanedMedia(mediaToCleanup)
}

const closeViewModal = () => {
  showViewModal.value = false
}

const handleJsonlUpload = async (file: File) => {
  uploading.value = true
  try {
    const parsed = await parseFlashcardsFromJsonl(file)
    const refToId = new Map<string, string>()
    const cardsWithBlockedBy: Array<{ id: string; front: string; back: string; tagIds: string[]; blockedByRefs: string[] }> = []

    // Phase 1: Create all cards and build ref map
    for (const item of parsed) {
      const tagIds: string[] = []
      if (item.tags) {
        for (const tagContent of item.tags) {
          const tag = await getOrCreateTag(tagContent)
          tagIds.push(tag.id)
        }
      }
      const card = await createFlashcard(item.front, item.back, [], tagIds)

      if (item.ref) {
        refToId.set(item.ref, card.id)
      }

      if (item.blockedBy && item.blockedBy.length > 0) {
        cardsWithBlockedBy.push({
          id: card.id,
          front: card.front,
          back: card.back,
          tagIds,
          blockedByRefs: item.blockedBy
        })
      }
    }

    // Phase 2: Resolve blockedBy references
    for (const card of cardsWithBlockedBy) {
      const resolvedBlockedBy = card.blockedByRefs
        .map(ref => refToId.get(ref))
        .filter((id): id is string => id !== undefined)

      if (resolvedBlockedBy.length > 0) {
        await updateFlashcard(card.id, card.front, card.back, resolvedBlockedBy, card.tagIds)
      }
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

    <div class="flex gap-2 mb-4">
      <button
        class="btn btn-sm btn-outline"
        @click="selectAll"
      >
        <CheckSquare class="w-4 h-4" />
        Select All
      </button>
      <button
        class="btn btn-sm btn-outline"
        :disabled="!someSelected"
        @click="deselectAll"
      >
        <Square class="w-4 h-4" />
        Deselect All
      </button>
      <button
        class="btn btn-sm btn-error"
        :disabled="!someSelected"
        @click="handleDeleteSelected"
      >
        <Trash2 class="w-4 h-4" />
        Delete Selected ({{ selectedIds.size }})
      </button>
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

    <div class="overflow-x-auto">
      <table class="table w-full table-fixed">
        <thead>
          <tr>
            <th class="w-12">
              <input
                type="checkbox"
                class="checkbox"
                :checked="allSelected"
                @change="allSelected ? deselectAll() : selectAll()"
              >
            </th>
            <th class="w-2/5">
              Front
            </th>
            <th class="w-2/5">
              Back
            </th>
            <th class="w-1/5">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filteredItems"
            :key="item.id"
          >
            <td>
              <input
                type="checkbox"
                class="checkbox"
                :checked="selectedIds.has(item.id)"
                @change="toggleSelect(item.id)"
              >
            </td>
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
          :show-back="true"
          :tags="viewModalTags"
          :front-media-ids="viewModalCard.frontMediaIds"
          :back-media-ids="viewModalCard.backMediaIds"
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
