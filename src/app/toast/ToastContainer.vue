<script setup lang="ts">
import { useToasts, dismissToast } from './toastStore'

const toasts = useToasts()
</script>

<template>
  <div class="toast toast-top toast-end">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="alert"
      :class="{
        'alert-info': toast.type === 'info',
        'alert-success': toast.type === 'success',
        'alert-error': toast.type === 'error'
      }"
    >
      <span>{{ toast.message }}</span>
      <button
        class="btn btn-sm btn-ghost"
        @click="dismissToast(toast.id)"
      >
        ✕
      </button>
    </div>
  </div>
</template>
