<script setup lang="ts">
import { ref, watch } from 'vue'
import { Target } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  currentFilter: string | null
}>()

const emit = defineEmits<{
  close: []
  activate: [filter: string]
  deactivate: []
}>()

const filter = ref(props.currentFilter ?? '')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) filter.value = props.currentFilter ?? ''
  }
)

function submit() {
  const trimmed = filter.value.trim()
  if (trimmed) emit('activate', trimmed)
}
</script>

<template>
  <dialog
    class="modal"
    :open="open"
  >
    <div class="modal-box max-w-sm">
      <h3 class="font-bold text-lg flex items-center gap-2">
        <Target class="w-5 h-5" />
        Focus Mode
      </h3>
      <p class="text-sm text-base-content/60 mt-1">
        Prefer cards whose front or back contains this text.
      </p>
      <div class="mt-4">
        <label class="label text-sm font-medium">Filter</label>
        <input
          v-model="filter"
          class="input input-bordered w-full"
          placeholder="e.g. algebra"
          autofocus
          @keyup.enter="submit"
        >
      </div>
      <div class="modal-action">
        <button
          v-if="currentFilter"
          class="btn btn-ghost"
          @click="emit('deactivate')"
        >
          Deactivate
        </button>
        <button
          class="btn btn-ghost"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          :disabled="!filter.trim()"
          @click="submit"
        >
          Activate
        </button>
      </div>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
      @submit.prevent="emit('close')"
    />
  </dialog>
</template>
