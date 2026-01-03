<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { MilkdownProvider } from '@milkdown/vue'
import MarkdownEditor from '@/dumb/MarkdownEditor.vue'

const props = defineProps<{
  initialFront?: string
  initialBack?: string
  submitLabel: string
  showCancel?: boolean
  isSaving?: boolean
}>()

const emit = defineEmits<{
  (event: 'save', value: { front: string; back: string }): void
  (event: 'cancel'): void
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

const canSave = computed(() => front.value.trim().length > 0 && back.value.trim().length > 0)

const handleSave = () => {
  if (!canSave.value || props.isSaving) return
  emit('save', { front: front.value.trim(), back: back.value.trim() })
}
</script>

<template>
  <div class="space-y-4">
    <div class="form-control">
      <label class="label">
        <span class="label-text">Front</span>
      </label>
      <div class="rounded-lg border border-base-300 bg-base-100 p-2">
        <MilkdownProvider>
          <MarkdownEditor
            :key="frontKey"
            v-model="front"
          />
        </MilkdownProvider>
      </div>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text">Back</span>
      </label>
      <div class="rounded-lg border border-base-300 bg-base-100 p-2">
        <MilkdownProvider>
          <MarkdownEditor
            :key="backKey"
            v-model="back"
          />
        </MilkdownProvider>
      </div>
    </div>

    <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <button
        v-if="showCancel"
        class="btn btn-ghost"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        class="btn btn-primary"
        :disabled="!canSave || isSaving"
        @click="handleSave"
      >
        {{ isSaving ? 'Saving...' : submitLabel }}
      </button>
    </div>
  </div>
</template>
