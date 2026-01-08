<script setup lang="ts">
import { ref } from 'vue'
import { Upload } from 'lucide-vue-next'

defineProps<{
  label?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (event: 'file', file: File): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)

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
</script>

<template>
  <div>
    <input
      ref="fileInput"
      type="file"
      accept=".zip"
      class="hidden"
      @change="handleFileChange"
    >
    <button
      class="btn btn-outline btn-sm"
      :disabled="loading"
      @click="openFilePicker"
    >
      <Upload :size="16" />
      {{ label || 'Upload ZIP' }}
    </button>
  </div>
</template>
