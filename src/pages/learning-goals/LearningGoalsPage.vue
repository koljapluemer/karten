<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useLearningGoalsStore } from '@/entities/learning-goals/learningGoalsStore'
import type { LearningGoalDoc } from '@/entities/learning-goals/LearningGoal'
import { getOpenAIKey } from '@/app/storage/llmSettings'
import MarkdownContent from '@/dumb/MarkdownContent.vue'
import LearningGoalNode from './LearningGoalNode.vue'
import LearningGoalModal from '@/features/learning-goal-add/LearningGoalModal.vue'
import ChildGoalsModal from '@/features/learning-goal-ai/ChildGoalsModal.vue'

const store = useLearningGoalsStore()
const router = useRouter()

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

onMounted(() => {
  store.loadLearningGoals()
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
  </div>
</template>
