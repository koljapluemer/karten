<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Link2, Plus } from 'lucide-vue-next'
import GradualClozeDeletionWizard from './GradualClozeDeletionWizard.vue'
import AIFlashcardGeneratorModal from './AIFlashcardGeneratorModal.vue'
import RelatedFlashcardNode from './RelatedFlashcardNode.vue'
import TagInput from '@/dumb/TagInput.vue'
import { showToast } from '@/app/toast/toastStore'
import { loadFlashcards, updateFlashcard, deleteFlashcard } from '@/entities/flashcard/flashcardStore'
import { getOpenAIKey } from '@/app/storage/openAIKey'
import type { Tag } from '@/db/Tag'
import type { FlashCard } from '@/db/Flashcard'
import type { FlashcardNode } from './relatedFlashcardsTypes'

const props = defineProps<{
  content: string
  relatedFlashcards: string[]
  tags: string[]
  allTags: Tag[]
}>()

const emit = defineEmits<{
  'update:content': [value: string]
  'update:related-flashcards': [value: string[]]
  'update:tags': [value: string[]]
  'create-tag': [content: string]
  blur: []
}>()

const router = useRouter()
const route = useRoute()

const allFlashcards = ref<FlashCard[]>([])
const attachOpen = ref(false)
const attachParentId = ref<string | null>(null)
const searchQuery = ref('')

onMounted(async () => {
  allFlashcards.value = await loadFlashcards()
})

const contentValue = computed({
  get: () => props.content,
  set: (value: string) => emit('update:content', value)
})

const relatedFlashcardsValue = computed({
  get: () => props.relatedFlashcards ?? [],
  set: (value: string[]) => emit('update:related-flashcards', value)
})

const tagsValue = computed({
  get: () => props.tags ?? [],
  set: (value: string[]) => emit('update:tags', value)
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
  relatedFlashcardsValue.value
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
      : relatedFlashcardsValue.value
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
  if (relatedFlashcardsValue.value.includes(id)) return
  relatedFlashcardsValue.value = [...relatedFlashcardsValue.value, id]
  showToast('Flashcard attached', 'success')
}

const attachBlockedBy = async (parentId: string, childId: string) => {
  const parent = getCardById(parentId)
  if (!parent || parent.blockedBy.includes(childId)) return
  const blockedBy = [...parent.blockedBy, childId]
  await updateFlashcard(parent.id, parent.front, parent.back, blockedBy)
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
    relatedFlashcardsValue.value = relatedFlashcardsValue.value.filter((id) => id !== payload.cardId)
    showToast('Flashcard detached', 'info')
    return
  }
  const parent = getCardById(payload.parentId)
  if (!parent) return
  const blockedBy = parent.blockedBy.filter((id) => id !== payload.cardId)
  await updateFlashcard(parent.id, parent.front, parent.back, blockedBy)
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

const handleEditFlashcard = (id: string) => {
  router.push({
    path: `/flashcards/${id}/edit`,
    query: {
      returnTo: route.fullPath
    }
  })
}

const handleDeleteFlashcard = async (id: string) => {
  if (!confirm('Delete this flashcard?')) return
  await deleteFlashcard(id)

  relatedFlashcardsValue.value = relatedFlashcardsValue.value.filter((relatedId) => relatedId !== id)

  const remaining = allFlashcards.value.filter((card) => card.id !== id)
  const parents = remaining.filter((card) => card.blockedBy.includes(id))

  for (const parent of parents) {
    const blockedBy = parent.blockedBy.filter((childId) => childId !== id)
    await updateFlashcard(parent.id, parent.front, parent.back, blockedBy)
    updateLocalFlashcard({ ...parent, blockedBy })
  }

  allFlashcards.value = remaining
  showToast('Flashcard deleted', 'info')
}

const wizardOpen = ref(false)
const aiModalOpen = ref(false)

const openWizard = () => {
  wizardOpen.value = true
}

const openAIModal = () => {
  const apiKey = getOpenAIKey()
  if (!apiKey) {
    showToast('Please set OpenAI API key in settings', 'error')
    router.push('/settings')
    return
  }
  aiModalOpen.value = true
}

const handleAIModalAccept = (cardIds: string[]) => {
  const newRelated = [...relatedFlashcardsValue.value]
  for (const id of cardIds) {
    if (!newRelated.includes(id)) {
      newRelated.push(id)
    }
  }
  relatedFlashcardsValue.value = newRelated
  aiModalOpen.value = false
  emit('blur')
}

const handleWizardComplete = (lastCardId: string) => {
  if (!relatedFlashcardsValue.value.includes(lastCardId)) {
    relatedFlashcardsValue.value = [...relatedFlashcardsValue.value, lastCardId]
  }
  emit('blur')
  showToast('Gradual cloze deletion created', 'success')
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="card bg-base-200">
      <div class="card-body">
        <h2 class="card-title">
          Core Data 
        </h2>
        <fieldset class="fieldset">
          <label
            for="learning-content"
            class="label"
          >Learning Content</label>
          <textarea
            id="learning-content"
            v-model="contentValue"
            name="learning-content"
            class="textarea"
            rows="10"
            @blur="emit('blur')"
          />
        </fieldset>

        <fieldset class="fieldset">
          <label class="label">Tags</label>
          <TagInput
            v-model="tagsValue"
            :all-tags="allTags"
            @create-tag="(content) => emit('create-tag', content)"
          />
        </fieldset>
      </div>
    </div>

    <div class="card bg-base-200">
      <div class="card-body">
        <h2 class="card-title">
          Related Flashcards
        </h2>
        <div class="flex gap-2">
          <button
            class="btn btn-sm"
            @click="openAIModal"
          >
            AI Generate Flashcards
          </button>
          <button
            class="btn btn-sm"
            @click="openWizard"
          >
            Establish gradual cloze deletion
          </button>


          <button
            class="btn btn-sm"
            title="Attach existing"
            @click="openAttachPanel(null)"
          >
            <Link2 /> Link
          </button>
          <button
            class="btn btn-sm"
            title="Create new"
            @click="handleOpenCreate(null)"
          >
            <Plus />
            Add New
          </button>
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
            @edit="handleEditFlashcard"
            @delete="handleDeleteFlashcard"
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
            <Plus />
            Create New Flashcard
          </button>
        </div>
      </div>
    </div>
  </div>

  <GradualClozeDeletionWizard
    v-model:open="wizardOpen"
    :initial-content="contentValue"
    @complete="handleWizardComplete"
  />

  <AIFlashcardGeneratorModal
    :open="aiModalOpen"
    :content="contentValue"
    @close="aiModalOpen = false"
    @accept="handleAIModalAccept"
  />
</template>
