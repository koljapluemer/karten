<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  submitLabel: string
  initialValue?: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'save', value: string): void
}>()

const value = ref(props.initialValue ?? '')

watch(
  () => props.open,
  (open) => {
    if (open) {
      value.value = props.initialValue ?? ''
    }
  }
)

const handleSave = () => {
  const trimmed = value.value.trim()
  if (!trimmed) return
  emit('save', trimmed)
}
</script>

<template>
  <dialog
    class="modal"
    :open="open"
    @close="emit('close')"
  >
    <div class="modal-box space-y-4">
      <h3 class="text-lg font-semibold">
        {{ title }}
      </h3>
      <div class="form-control">
        <label class="label">
          <span class="label-text">Material</span>
        </label>
        <textarea
          v-model="value"
          class="textarea textarea-bordered min-h-[160px]"
        />
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          class="btn btn-ghost"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          @click="handleSave"
        >
          {{ submitLabel }}
        </button>
      </div>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
      @click.prevent="emit('close')"
    >
      <button aria-label="Close">
        close
      </button>
    </form>
  </dialog>
</template>
