<script setup lang="ts">
import { ref, useSlots } from 'vue'
import { Upload, Info } from 'lucide-vue-next'

defineProps<{
  label: string
  accept: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (event: 'file', file: File): void
}>()

const slots = useSlots()
const fileInput = ref<HTMLInputElement | null>(null)
const infoDialog = ref<HTMLDialogElement | null>(null)

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    emit('file', file)
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const openFilePicker = () => {
  fileInput.value?.click()
}

const openInfo = () => {
  infoDialog.value?.showModal()
}
</script>

<template>
  <div class="flex items-center gap-1">
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      class="hidden"
      @change="handleFileChange"
    >
    <button
      class="btn btn-sm"
      :disabled="loading"
      @click="openFilePicker"
    >
      <Upload class="w-4 h-4" />
      {{ label }}
    </button>
    <button
      v-if="slots.info"
      class="btn btn-ghost btn-xs btn-circle"
      @click="openInfo"
    >
      <Info class="w-4 h-4 opacity-50" />
    </button>
    <dialog
      v-if="slots.info"
      ref="infoDialog"
      class="modal"
    >
      <div class="modal-box max-w-2xl">
        <slot name="info" />
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm">
              Close
            </button>
          </form>
        </div>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
      >
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
