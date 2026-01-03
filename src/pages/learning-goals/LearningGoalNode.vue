<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, ChevronRight, Eye, Pencil, Plus, Sparkles, Trash2, Wand2 } from 'lucide-vue-next'
import type { LearningGoalDoc } from '@/entities/learning-goals/LearningGoal'

defineOptions({ name: 'LearningGoalNode' })

const props = defineProps<{
  goal: LearningGoalDoc
  goalMap: Record<string, LearningGoalDoc>
}>()

const emit = defineEmits<{
  (event: 'view', goalId: string): void
  (event: 'edit', goalId: string): void
  (event: 'add-child', goalId: string): void
  (event: 'generate-children', goalId: string): void
  (event: 'manage-flashcards', goalId: string): void
  (event: 'generate-flashcards', goalId: string): void
  (event: 'delete', goalId: string): void
}>()

const isOpen = ref(false)

const children = computed(() =>
  props.goal.requiresLearning
    .map((id) => props.goalMap[id])
    .filter((goal): goal is LearningGoalDoc => Boolean(goal))
)

const toggle = () => {
  if (!children.value.length) return
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="border-b border-base-200 py-2">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 min-w-0">
        <button
          class="btn btn-ghost btn-xs"
          :class="{ 'opacity-40': !children.length }"
          @click.stop="toggle"
        >
          <ChevronDown
            v-if="isOpen"
            :size="16"
          />
          <ChevronRight
            v-else
            :size="16"
          />
        </button>
        <div class="truncate font-medium">
          {{ goal.title }}
        </div>
      </div>
      <div class="flex items-center gap-1">
        <button
          class="btn btn-ghost btn-xs"
          @click.stop="emit('view', goal._id)"
        >
          <Eye :size="16" />
        </button>
        <button
          class="btn btn-ghost btn-xs"
          @click.stop="emit('manage-flashcards', goal._id)"
        >
          {{ goal.flashcards.length }}
        </button>
        <button
          class="btn btn-ghost btn-xs"
          @click.stop="emit('generate-flashcards', goal._id)"
        >
          <Wand2 :size="16" />
        </button>
        <button
          class="btn btn-ghost btn-xs"
          @click.stop="emit('edit', goal._id)"
        >
          <Pencil :size="16" />
        </button>
        <button
          class="btn btn-ghost btn-xs"
          @click.stop="emit('add-child', goal._id)"
        >
          <Plus :size="16" />
        </button>
        <button
          class="btn btn-ghost btn-xs"
          @click.stop="emit('generate-children', goal._id)"
        >
          <Sparkles :size="16" />
        </button>
        <button
          class="btn btn-ghost btn-xs text-error"
          @click.stop="emit('delete', goal._id)"
        >
          <Trash2 :size="16" />
        </button>
      </div>
    </div>
    <div
      v-if="isOpen"
      class="mt-2 space-y-2 border-l border-base-200 pl-4"
    >
      <LearningGoalNode
        v-for="child in children"
        :key="child._id"
        :goal="child"
        :goal-map="goalMap"
        @view="emit('view', $event)"
        @edit="emit('edit', $event)"
        @add-child="emit('add-child', $event)"
        @generate-children="emit('generate-children', $event)"
        @manage-flashcards="emit('manage-flashcards', $event)"
        @generate-flashcards="emit('generate-flashcards', $event)"
        @delete="emit('delete', $event)"
      />
      <div
        v-if="!children.length"
        class="text-sm opacity-60"
      >
        No sub-goals
      </div>
    </div>
  </div>
</template>
