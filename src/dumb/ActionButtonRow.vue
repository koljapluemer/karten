<script setup lang="ts">
const props = defineProps<{
  actions: { id: string; label: string; variant?: 'primary' | 'outline' | 'ghost'; disabled?: boolean }[]
}>()

const emit = defineEmits<{
  (event: 'select', id: string): void
}>()

const buttonClass = (variant?: 'primary' | 'outline' | 'ghost') => {
  if (variant === 'primary') return 'btn '
  if (variant === 'ghost') return 'btn '
  return 'btn '
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-2">
    <button
      v-for="action in props.actions"
      :key="action.id"
      :class="buttonClass(action.variant)"
      :disabled="action.disabled"
      @click="emit('select', action.id)"
    >
      {{ action.label }}
    </button>
  </div>
</template>
