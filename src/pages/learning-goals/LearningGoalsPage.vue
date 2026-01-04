<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useLearningGoalsStore } from '@/entities/learning-goals/learningGoalsStore'
import type { LearningGoalDoc } from '@/entities/learning-goals/LearningGoal'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'
import { useFlashcardsStore } from '@/entities/flashcards/flashcardsStore'
import { getOpenAIKey } from '@/app/storage/llmSettings'
import MarkdownContent from '@/dumb/MarkdownContent.vue'
import LearningGoalNode from './LearningGoalNode.vue'
import LearningGoalModal from '@/features/learning-goal-add/LearningGoalModal.vue'
import ChildGoalsModal from '@/features/learning-goal-ai/ChildGoalsModal.vue'
import GoalFlashcardsModal from './GoalFlashcardsModal.vue'
import FlashcardModal from '@/features/flashcard-add/FlashcardModal.vue'
import FlashcardAIModal from '@/features/flashcard-ai/FlashcardAIModal.vue'
import OverlappingFlashcardsModal from './OverlappingFlashcardsModal.vue'

const store = useLearningGoalsStore()
const router = useRouter()
const flashcardsStore = useFlashcardsStore()

const modalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const modalParentId = ref<string | undefined>()
const editingGoalId = ref<string | null>(null)
const isSaving = ref(false)
const modalKey = ref(0)

const viewOpen = ref(false)
const viewGoalId = ref<string | null>(null)
const aiModalOpen = ref(false)
const aiGoalId = ref<string | null>(null)
const flashcardsModalOpen = ref(false)
const flashcardsGoalId = ref<string | null>(null)
const flashcardEditOpen = ref(false)
const flashcardEditId = ref<string | null>(null)
const flashcardAddOpen = ref(false)
const isFlashcardSaving = ref(false)
const aiFlashcardsOpen = ref(false)
const aiFlashcardsGoalId = ref<string | null>(null)
const overlapModalOpen = ref(false)
const overlapParentId = ref<string | null>(null)
const overlapAddOpen = ref(false)
const overlapEditOpen = ref(false)
const overlapEditId = ref<string | null>(null)

onMounted(() => {
  store.loadLearningGoals()
  flashcardsStore.loadFlashcards()
})

const goalMap = computed<Record<string, LearningGoalDoc>>(() => {
  const map: Record<string, LearningGoalDoc> = {}
  store.learningGoals.forEach((goal) => {
    map[goal._id] = goal
  })
  return map
})

const childGoalIds = computed(() => {
  const ids = new Set<string>()
  store.learningGoals.forEach((goal) => {
    goal.requiresLearning.forEach((id) => ids.add(id))
  })
  return ids
})

const topLevelGoals = computed(() =>
  store.learningGoals.filter((goal) => !childGoalIds.value.has(goal._id))
)

const editingGoal = computed(() =>
  editingGoalId.value ? store.learningGoals.find((goal) => goal._id === editingGoalId.value) : undefined
)

const viewGoal = computed(() =>
  viewGoalId.value ? store.learningGoals.find((goal) => goal._id === viewGoalId.value) : undefined
)

const aiGoal = computed(() => {
  if (!aiGoalId.value) return null
  return store.learningGoals.find((goal) => goal._id === aiGoalId.value) ?? null
})

const aiChildren = computed(() => {
  if (!aiGoal.value) return []
  return aiGoal.value.requiresLearning
    .map((id) => goalMap.value[id])
    .filter((goal): goal is LearningGoalDoc => Boolean(goal))
})

const flashcardsGoal = computed(() => {
  if (!flashcardsGoalId.value) return null
  return store.learningGoals.find((goal) => goal._id === flashcardsGoalId.value) ?? null
})

const editCard = computed<FlashCardDoc | null>(() => {
  if (!flashcardEditId.value) return null
  return flashcardsStore.flashcards.find((card) => card._id === flashcardEditId.value) ?? null
})

const aiFlashcardsGoal = computed(() => {
  if (!aiFlashcardsGoalId.value) return null
  return store.learningGoals.find((goal) => goal._id === aiFlashcardsGoalId.value) ?? null
})

const aiFlashcards = computed(() => {
  if (!aiFlashcardsGoal.value) return []
  const ids = new Set(aiFlashcardsGoal.value.flashcards)
  return flashcardsStore.flashcards.filter((card) => ids.has(card._id))
})

const overlapParentCard = computed(() => {
  if (!overlapParentId.value) return null
  return flashcardsStore.flashcards.find((card) => card._id === overlapParentId.value) ?? null
})

const overlapEditCard = computed<FlashCardDoc | null>(() => {
  if (!overlapEditId.value) return null
  return flashcardsStore.flashcards.find((card) => card._id === overlapEditId.value) ?? null
})

const openAddGoal = (parentId?: string) => {
  modalMode.value = 'add'
  modalParentId.value = parentId
  editingGoalId.value = null
  modalKey.value += 1
  modalOpen.value = true
}

const openEditGoal = (goalId: string) => {
  modalMode.value = 'edit'
  modalParentId.value = undefined
  editingGoalId.value = goalId
  modalKey.value += 1
  modalOpen.value = true
}

const closeModal = () => {
  modalOpen.value = false
}

const handleSave = async (payload: { title: string; content: string }) => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    if (modalMode.value === 'add') {
      await store.createLearningGoal(payload.title, payload.content, modalParentId.value)
    } else if (editingGoalId.value) {
      await store.updateLearningGoal(editingGoalId.value, {
        title: payload.title,
        content: payload.content || undefined
      })
    }
    modalOpen.value = false
  } finally {
    isSaving.value = false
  }
}

const openView = (goalId: string) => {
  viewGoalId.value = goalId
  viewOpen.value = true
}

const closeView = () => {
  viewOpen.value = false
  viewGoalId.value = null
}

const handleDelete = async (goalId: string) => {
  await store.deleteLearningGoal(goalId)
}

const openGenerateChildren = (goalId: string) => {
  const key = getOpenAIKey()
  if (!key) {
    router.push('/settings?redirect=/goals')
    return
  }
  aiGoalId.value = goalId
  aiModalOpen.value = true
}

const handleAiAccept = async (
  goals: { title: string; content?: string }[],
  generateAgain: boolean
) => {
  if (aiGoalId.value) {
    for (const goal of goals) {
      await store.createLearningGoal(goal.title, goal.content, aiGoalId.value)
    }
  }
  aiModalOpen.value = false
  if (generateAgain && aiGoalId.value) {
    await nextTick()
    aiModalOpen.value = true
  }
}

const closeAiModal = () => {
  aiModalOpen.value = false
}

const openFlashcardsModal = (goalId: string) => {
  flashcardsGoalId.value = goalId
  flashcardsModalOpen.value = true
}

const closeFlashcardsModal = () => {
  flashcardsModalOpen.value = false
}

const openFlashcardEdit = (cardId: string) => {
  flashcardEditId.value = cardId
  flashcardEditOpen.value = true
}

const closeFlashcardEdit = () => {
  flashcardEditOpen.value = false
  flashcardEditId.value = null
}

const openFlashcardAdd = () => {
  flashcardAddOpen.value = true
}

const closeFlashcardAdd = () => {
  flashcardAddOpen.value = false
}

const openOverlapsModal = (cardId: string) => {
  overlapParentId.value = cardId
  overlapModalOpen.value = true
}

const closeOverlapsModal = () => {
  overlapModalOpen.value = false
}

const openOverlapAdd = () => {
  overlapAddOpen.value = true
}

const closeOverlapAdd = () => {
  overlapAddOpen.value = false
}

const openOverlapEdit = (cardId: string) => {
  overlapEditId.value = cardId
  overlapEditOpen.value = true
}

const closeOverlapEdit = () => {
  overlapEditOpen.value = false
  overlapEditId.value = null
}

const openFlashcardAI = (goalId: string) => {
  const key = getOpenAIKey()
  if (!key) {
    router.push('/settings?redirect=/goals')
    return
  }
  aiFlashcardsGoalId.value = goalId
  aiFlashcardsOpen.value = true
}

const closeFlashcardAI = () => {
  aiFlashcardsOpen.value = false
}

const openFlashcardAIFromModal = () => {
  if (!flashcardsGoalId.value) return
  openFlashcardAI(flashcardsGoalId.value)
}

const handleFlashcardAdd = async (payload: { front: string; back: string }) => {
  if (!flashcardsGoalId.value || isFlashcardSaving.value) return
  isFlashcardSaving.value = true
  try {
    const card = await flashcardsStore.createFlashcard(payload.front, payload.back)
    await store.attachFlashcardToGoal(flashcardsGoalId.value, card._id)
    flashcardAddOpen.value = false
  } finally {
    isFlashcardSaving.value = false
  }
}

const handleFlashcardEdit = async (payload: { front: string; back: string }) => {
  if (!flashcardEditId.value || isFlashcardSaving.value) return
  isFlashcardSaving.value = true
  try {
    await flashcardsStore.updateFlashcard(flashcardEditId.value, payload)
    closeFlashcardEdit()
  } finally {
    isFlashcardSaving.value = false
  }
}

const handleFlashcardDetach = async (cardId: string) => {
  if (!flashcardsGoalId.value) return
  await store.detachFlashcardFromGoal(flashcardsGoalId.value, cardId)
}

const handleFlashcardDelete = async (cardId: string) => {
  await flashcardsStore.deleteFlashcard(cardId)
  await store.removeFlashcardFromAllGoals(cardId)
}

const handleOverlapAdd = async (payload: { front: string; back: string }) => {
  if (!overlapParentId.value || isFlashcardSaving.value) return
  isFlashcardSaving.value = true
  try {
    const card = await flashcardsStore.createFlashcard(payload.front, payload.back)
    await flashcardsStore.addOverlapping(overlapParentId.value, card._id)
    overlapAddOpen.value = false
  } finally {
    isFlashcardSaving.value = false
  }
}

const handleOverlapEdit = async (payload: { front: string; back: string }) => {
  if (!overlapEditId.value || isFlashcardSaving.value) return
  isFlashcardSaving.value = true
  try {
    await flashcardsStore.updateFlashcard(overlapEditId.value, payload)
    closeOverlapEdit()
  } finally {
    isFlashcardSaving.value = false
  }
}

const handleOverlapDetach = async (cardId: string) => {
  if (!overlapParentId.value) return
  await flashcardsStore.removeOverlapping(overlapParentId.value, cardId)
}

const handleOverlapDelete = async (cardId: string) => {
  await flashcardsStore.deleteFlashcard(cardId)
  await store.removeFlashcardFromAllGoals(cardId)
}

const handleFlashcardAiAccept = async (
  cards: { front: string; back: string }[],
  generateAgain: boolean
) => {
  if (!aiFlashcardsGoalId.value) return
  for (const card of cards) {
    const created = await flashcardsStore.createFlashcard(card.front, card.back)
    await store.attachFlashcardToGoal(aiFlashcardsGoalId.value, created._id)
  }
  aiFlashcardsOpen.value = false
  if (generateAgain && aiFlashcardsGoalId.value) {
    await nextTick()
    aiFlashcardsOpen.value = true
  }
}
</script>

<template>
  <div class="w-full max-w-4xl space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold">
          Learning Goals
        </h1>
        <p class="text-sm opacity-70">
          Keep goals lean and link them by dependencies.
        </p>
      </div>
      <button
        class="btn btn-primary btn-sm sm:btn-md"
        @click="openAddGoal()"
      >
        <Plus :size="18" />
        Add Goal
      </button>
    </div>

    <div
      v-if="!topLevelGoals.length"
      class="text-sm opacity-70"
    >
      No goals yet. Add your first goal to get started.
    </div>

    <div
      v-else
      class="space-y-2"
    >
      <LearningGoalNode
        v-for="goal in topLevelGoals"
        :key="goal._id"
        :goal="goal"
        :goal-map="goalMap"
        @view="openView"
        @edit="openEditGoal"
        @add-child="openAddGoal"
        @generate-children="openGenerateChildren"
        @manage-flashcards="openFlashcardsModal"
        @generate-flashcards="openFlashcardAI"
        @delete="handleDelete"
      />
    </div>

    <LearningGoalModal
      :open="modalOpen"
      :mode="modalMode"
      :form-key="modalKey"
      :initial-title="editingGoal?.title"
      :initial-content="editingGoal?.content"
      :is-saving="isSaving"
      @close="closeModal"
      @save="handleSave"
    />

    <dialog
      class="modal"
      :open="viewOpen"
      @close="closeView"
    >
      <div class="modal-box space-y-4">
        <div class="flex items-start justify-between gap-3">
          <h2 class="text-xl font-semibold">
            Goal Details
          </h2>
          <button
            class="btn btn-ghost btn-sm"
            @click="closeView"
          >
            <X :size="18" />
          </button>
        </div>
        <div
          v-if="viewGoal"
          class="space-y-4"
        >
          <div>
            <MarkdownContent :value="viewGoal.title" />
          </div>
          <div v-if="viewGoal.content">
            <MarkdownContent :value="viewGoal.content" />
          </div>
          <div
            v-else
            class="text-sm opacity-60"
          >
            No content yet.
          </div>
        </div>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
        @click.prevent="closeView"
      >
        <button aria-label="Close">
          close
        </button>
      </form>
    </dialog>

    <ChildGoalsModal
      :open="aiModalOpen"
      :goal="aiGoal"
      :direct-children="aiChildren"
      @close="closeAiModal"
      @accept="handleAiAccept"
    />

    <GoalFlashcardsModal
      :open="flashcardsModalOpen"
      :goal="flashcardsGoal"
      :flashcards="flashcardsStore.flashcards"
      @close="closeFlashcardsModal"
      @add="openFlashcardAdd"
      @generate="openFlashcardAIFromModal"
      @edit="openFlashcardEdit"
      @overlaps="openOverlapsModal"
      @detach="handleFlashcardDetach"
      @delete="handleFlashcardDelete"
    />

    <FlashcardModal
      :open="flashcardAddOpen"
      title="Add Flashcard"
      submit-label="Add Flashcard"
      :is-saving="isFlashcardSaving"
      @close="closeFlashcardAdd"
      @save="handleFlashcardAdd"
    />

    <FlashcardModal
      :open="flashcardEditOpen"
      title="Edit Flashcard"
      submit-label="Save Changes"
      :initial-front="editCard?.front"
      :initial-back="editCard?.back"
      :is-saving="isFlashcardSaving"
      @close="closeFlashcardEdit"
      @save="handleFlashcardEdit"
    />

    <FlashcardAIModal
      :open="aiFlashcardsOpen"
      :goal="aiFlashcardsGoal"
      :attached-flashcards="aiFlashcards"
      @close="closeFlashcardAI"
      @accept="handleFlashcardAiAccept"
    />

    <OverlappingFlashcardsModal
      :open="overlapModalOpen"
      :card="overlapParentCard"
      :flashcards="flashcardsStore.flashcards"
      @close="closeOverlapsModal"
      @add="openOverlapAdd"
      @edit="openOverlapEdit"
      @detach="handleOverlapDetach"
      @delete="handleOverlapDelete"
    />

    <FlashcardModal
      :open="overlapAddOpen"
      title="Add Overlapping Flashcard"
      submit-label="Add Flashcard"
      :is-saving="isFlashcardSaving"
      @close="closeOverlapAdd"
      @save="handleOverlapAdd"
    />

    <FlashcardModal
      :open="overlapEditOpen"
      title="Edit Overlapping Flashcard"
      submit-label="Save Changes"
      :initial-front="overlapEditCard?.front"
      :initial-back="overlapEditCard?.back"
      :is-saving="isFlashcardSaving"
      @close="closeOverlapEdit"
      @save="handleOverlapEdit"
    />
  </div>
</template>
