<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  initialFront?: string
  initialBack?: string
  submitLabel: string
  cardType?: 'declaritive' | 'procedural'
  showCancel?: boolean
  isSaving?: boolean
  actions?: { id: string; label: string; variant?: 'primary' | 'outline' | 'ghost' }[]
}>()

const emit = defineEmits<{
  (event: 'save', value: { front: string; back: string }): void
  (event: 'cancel'): void
  (event: 'action', value: { id: string; payload: { front: string; back: string } }): void
}>()

const front = ref(props.initialFront ?? '')
const back = ref(props.initialBack ?? '')
const frontKey = ref(0)
const backKey = ref(0)

watch(
  () => [props.initialFront, props.initialBack],
  () => {
    front.value = props.initialFront ?? ''
    back.value = props.initialBack ?? ''
    frontKey.value += 1
    backKey.value += 1
  }
)

const canSave = computed(() => {
  if (props.cardType === 'procedural') return front.value.trim().length > 0
  return front.value.trim().length > 0 && back.value.trim().length > 0
})

const handleSave = () => {
  if (!canSave.value || props.isSaving) return
  const trimmedFront = front.value.trim()
  const trimmedBack = props.cardType === 'procedural' ? '' : back.value.trim()
  emit('save', { front: trimmedFront, back: trimmedBack })
}

const handleAction = (id: string) => {
  if (!canSave.value || props.isSaving) return
  const trimmedFront = front.value.trim()
  const trimmedBack = props.cardType === 'procedural' ? '' : back.value.trim()
  emit('action', { id, payload: { front: trimmedFront, back: trimmedBack } })
}

const buttonClass = (variant?: 'primary' | 'outline' | 'ghost') => {
  if (variant === 'primary') return 'btn '
  if (variant === 'ghost') return 'btn '
  return 'btn '
}
</script>

<template>
  <div class="space-y-4">
    <div class="form-control">
      <label class="label">
        <span class="label-text">Front</span>
      </label>
      <textarea
        :key="frontKey"
        v-model="front"
        class="textarea textarea-bordered w-full min-h-[160px]"
      />
    </div>

    <div
      v-if="cardType !== 'procedural'"
      class="form-control"
    >
      <label class="label">
        <span class="label-text">Back</span>
      </label>
      <textarea
        :key="backKey"
        v-model="back"
        class="textarea textarea-bordered w-full min-h-[160px]"
      />
    </div>

    <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <template v-if="actions?.length">
        <button
          v-for="action in actions"
          :key="action.id"
          :class="buttonClass(action.variant)"
          :disabled="!canSave || isSaving"
          @click="handleAction(action.id)"
        >
          {{ action.label }}
        </button>
      </template>
      <template v-else>
        <button
          v-if="showCancel"
          class="btn "
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          class="btn "
          :disabled="!canSave || isSaving"
          @click="handleSave"
        >
          {{ isSaving ? 'Saving...' : submitLabel }}
        </button>
      </template>
    </div>
  </div>
</template>
