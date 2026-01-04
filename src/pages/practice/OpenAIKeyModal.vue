<script setup lang="ts">
import { ref, watch } from 'vue'
import { setOpenAIKey } from '@/app/storage/openAIKey'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'saved'): void
}>()

const apiKey = ref('')
const error = ref<string | null>(null)

const reset = () => {
  apiKey.value = ''
  error.value = null
}

watch(
  () => props.open,
  (open) => {
    if (open) reset()
  }
)

const handleSave = () => {
  const trimmed = apiKey.value.trim()
  if (!trimmed) {
    error.value = 'Please enter an API key.'
    return
  }
  setOpenAIKey(trimmed)
  emit('saved')
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
        OpenAI API Key
      </h3>
      <div class="form-control">
        <label class="label">
          <span class="label-text">API Key</span>
        </label>
        <input
          v-model="apiKey"
          type="password"
          class="input input-bordered"
          autocomplete="off"
        >
      </div>
      <div
        v-if="error"
        class="text-sm text-error"
      >
        {{ error }}
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
          Save
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
