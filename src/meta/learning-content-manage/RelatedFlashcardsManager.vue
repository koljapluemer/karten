<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Link2, Plus } from 'lucide-vue-next'
import { loadFlashcards, updateFlashcard, deleteFlashcard } from '@/entities/flashcard/flashcardStore'
import { showToast } from '@/app/toast/toastStore'
import FlashcardRenderer from '@/entities/flashcard/FlashcardRenderer.vue'
import RelatedFlashcardNode from './RelatedFlashcardNode.vue'
import type { FlashCard } from '@/db/Flashcard'
import type { FlashcardNode } from './relatedFlashcardsTypes'

const router = useRouter()
const route = useRoute()

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const allFlashcards = ref<FlashCard[]>([])
const attachOpen = ref(false)
const attachParentId = ref<string | null>(null)
const searchQuery = ref('')
const showViewModal = ref(false)
const viewFlashcard = ref<FlashCard | null>(null)

onMounted(async () => {
  allFlashcards.value = await loadFlashcards()
})

const getCardById = (id: string): FlashCard | undefined =>
  allFlashcards.value.find((card) => card.id === id)

const buildTree = (
  id: string,
  seen: Set<string>,
  parentId: string | null
): FlashcardNode | null => {
  const card = getCardById(id)
  if (!card) return null
  const repeated = seen.has(id)
  if (repeated) {
    return { card, children: [], parentId, repeated: true }
  }
  seen.add(id)
  const children = card.blockedBy
    .map((childId) => buildTree(childId, seen, card.id))
    .filter((child): child is FlashcardNode => child !== null)
  return { card, children, parentId, repeated: false }
}

const relatedNodes = computed(() =>
  props.modelValue
    .map((id) => buildTree(id, new Set<string>(), null))
    .filter((node): node is FlashcardNode => node !== null)
)

const attachLabel = computed(() => {
  if (!attachOpen.value) return ''
  if (!attachParentId.value) return 'Attach flashcard to learning content'
  const parent = getCardById(attachParentId.value)
  if (!parent) return 'Attach prerequisite'
  return `Attach prerequisite to "${parent.front}"`
})

const searchResults = computed(() => {
  if (!attachOpen.value) return []
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return []

  const excluded = new Set<string>(
    attachParentId.value
      ? getCardById(attachParentId.value)?.blockedBy ?? []
      : props.modelValue
  )

  if (attachParentId.value) {
    excluded.add(attachParentId.value)
  }

  return allFlashcards.value
    .filter((card) => !excluded.has(card.id))
    .filter(
      (card) =>
        card.front.toLowerCase().includes(query) || card.back.toLowerCase().includes(query)
    )
    .slice(0, 6)
})

const openAttachPanel = (parentId: string | null) => {
  attachOpen.value = true
  attachParentId.value = parentId
  searchQuery.value = ''
}

const closeAttachPanel = () => {
  attachOpen.value = false
  attachParentId.value = null
  searchQuery.value = ''
}

const updateLocalFlashcard = (updated: FlashCard) => {
  allFlashcards.value = allFlashcards.value.map((card) =>
    card.id === updated.id ? updated : card
  )
}

const attachRelated = (id: string) => {
  if (props.modelValue.includes(id)) return
  emit('update:modelValue', [...props.modelValue, id])
  showToast('Flashcard attached', 'success')
}

const attachBlockedBy = async (parentId: string, childId: string) => {
  const parent = getCardById(parentId)
  if (!parent || parent.blockedBy.includes(childId)) return
  const blockedBy = [...parent.blockedBy, childId]
  await updateFlashcard(parent.id, parent.front, parent.back, parent.instruction, blockedBy)
  updateLocalFlashcard({ ...parent, blockedBy })
  showToast('Flashcard attached', 'success')
}

const handleAttachExisting = async (id: string) => {
  if (attachParentId.value) {
    await attachBlockedBy(attachParentId.value, id)
  } else {
    attachRelated(id)
  }
  closeAttachPanel()
}

const handleDetach = async (payload: { cardId: string; parentId: string | null }) => {
  if (!payload.parentId) {
    emit('update:modelValue', props.modelValue.filter((id) => id !== payload.cardId))
    showToast('Flashcard detached', 'info')
    return
  }
  const parent = getCardById(payload.parentId)
  if (!parent) return
  const blockedBy = parent.blockedBy.filter((id) => id !== payload.cardId)
  await updateFlashcard(parent.id, parent.front, parent.back, parent.instruction, blockedBy)
  updateLocalFlashcard({ ...parent, blockedBy })
  showToast('Flashcard detached', 'info')
}

const handleOpenCreate = (parentId: string | null) => {
  closeAttachPanel()
  const query: Record<string, string> = {
    returnTo: route.fullPath,
    context: parentId ? 'prerequisite-creation' : 'related-creation'
  }
  if (parentId) {
    query.attachToParentId = parentId
  }
  router.push({
    path: '/flashcards/add',
    query
  })
}

const handleView = (card: FlashCard) => {
  viewFlashcard.value = card
  showViewModal.value = true
}

const handleEdit = (id: string) => {
  router.push({
    path: `/flashcards/${id}/edit`,
    query: {
      returnTo: route.fullPath
    }
  })
}

const handleDelete = async (id: string) => {
  if (!confirm('Delete this flashcard?')) return
  await deleteFlashcard(id)

  emit('update:modelValue', props.modelValue.filter((relatedId) => relatedId !== id))

  const remaining = allFlashcards.value.filter((card) => card.id !== id)
  const parents = remaining.filter((card) => card.blockedBy.includes(id))

  for (const parent of parents) {
    const blockedBy = parent.blockedBy.filter((childId) => childId !== id)
    await updateFlashcard(parent.id, parent.front, parent.back, parent.instruction, blockedBy)
    updateLocalFlashcard({ ...parent, blockedBy })
  }

  allFlashcards.value = remaining
  if (viewFlashcard.value?.id === id) {
    showViewModal.value = false
    viewFlashcard.value = null
  }
  showToast('Flashcard deleted', 'info')
}
</script>

<template>
    <div class="flex items-start justify-between gap-2">
      <div class="flex gap-2">
        <button
          class="btn btn-sm"
          title="Attach existing"
          @click="openAttachPanel(null)"
        >
          <Link2  /> Link
        </button>
        <button
          class="btn btn-sm"
          title="Create new"
          @click="handleOpenCreate(null)"
        >
          <Plus  />
          Add New
        </button>
      </div>
    </div>

    <div
      v-if="relatedNodes.length === 0"
      class="text-light"
    >
      No related flashcards yet.
    </div>

    <div class="flex flex-col gap-2">
      <RelatedFlashcardNode
        v-for="node in relatedNodes"
        :key="node.card.id"
        :node="node"
        :depth="0"
        @view="handleView"
        @edit="handleEdit"
        @delete="handleDelete"
        @detach="handleDetach"
        @attach-existing="openAttachPanel"
        @create-child="handleOpenCreate"
      />
    </div>

    <div
      v-if="attachOpen"
      class="border-t pt-4 mt-4"
    >
      <div class="flex items-start justify-between gap-2">
        <div>
          <h4 class="font-bold mb-2">
            Attach Flashcard
          </h4>
          <p class="text-light mb-4">
            {{ attachLabel }}
          </p>
        </div>
        <button
          class="btn btn-sm btn-ghost"
          @click="closeAttachPanel"
        >
          Close
        </button>
      </div>

      <fieldset class="fieldset">
        <label
          for="attach-flashcard-search"
          class="label"
        >Search flashcards</label>
        <input
          id="attach-flashcard-search"
          v-model="searchQuery"
          type="text"
          class="input"
          placeholder="Search by front or back..."
        >
      </fieldset>

      <div
        v-if="searchResults.length > 0"
        class="flex flex-col gap-1"
      >
        <button
          v-for="card in searchResults"
          :key="card.id"
          class="btn btn-sm btn-ghost justify-start"
          @click="handleAttachExisting(card.id)"
        >
          <span class="truncate">{{ card.front }}</span>
          <span class="text-light truncate">{{ card.back }}</span>
        </button>
      </div>

      <button
        class="btn btn-sm mt-4"
        @click="handleOpenCreate(attachParentId)"
      >
        <Plus  />
        Create New Flashcard
      </button>
    </div>

    <dialog
      :open="showViewModal"
      class="modal"
    >
      <div class="modal-box">
        <FlashcardRenderer
          v-if="viewFlashcard"
          :front="viewFlashcard.front"
          :back="viewFlashcard.back"
          :instruction="viewFlashcard.instruction"
          :show-back="true"
        />
        <div class="modal-action">
          <button
            class="btn"
            @click="showViewModal = false"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
</template>
