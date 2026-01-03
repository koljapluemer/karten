<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { MilkdownProvider } from '@milkdown/vue'
import MarkdownEditor from '@/dumb/MarkdownEditor.vue'

const props = defineProps<{
  initialTitle?: string
  initialContent?: string
  mode: 'add' | 'edit'
  isSaving?: boolean
}>()

const emit = defineEmits<{
  (event: 'save', value: { title: string; content: string }): void
  (event: 'cancel'): void
}>()

const title = ref(props.initialTitle ?? '')
const content = ref(props.initialContent ?? '')
const titleKey = ref(0)
const contentKey = ref(0)

watch(
  () => [props.initialTitle, props.initialContent],
  () => {
    title.value = props.initialTitle ?? ''
    content.value = props.initialContent ?? ''
    titleKey.value += 1
    contentKey.value += 1
  }
)

const canSave = computed(() => title.value.trim().length > 0)

const handleSave = () => {
  if (!canSave.value || props.isSaving) return
  emit('save', { title: title.value.trim(), content: content.value.trim() })
}
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-2">
      <h3 class="text-lg font-semibold">
        {{ mode === 'add' ? 'Add Learning Goal' : 'Edit Learning Goal' }}
      </h3>
      <p class="text-sm opacity-70">
        Title is required. Content is optional.
      </p>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text">Title</span>
      </label>
      <div class="rounded-lg border border-base-300 bg-base-100 p-2">
        <MilkdownProvider>
          <MarkdownEditor
            :key="titleKey"
            v-model="title"
          />
        </MilkdownProvider>
      </div>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text">Content</span>
      </label>
      <div class="rounded-lg border border-base-300 bg-base-100 p-2">
        <MilkdownProvider>
          <MarkdownEditor
            :key="contentKey"
            v-model="content"
          />
        </MilkdownProvider>
      </div>
    </div>

    <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <button
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
        {{ isSaving ? 'Saving...' : mode === 'add' ? 'Add Goal' : 'Save Changes' }}
      </button>
    </div>
  </div>
</template>
