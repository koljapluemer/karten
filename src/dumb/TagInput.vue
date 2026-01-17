<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, RotateCcw } from 'lucide-vue-next'
import type { Tag } from '@/db/Tag'

const props = withDefaults(defineProps<{
  modelValue: string[]
  allTags: Tag[]
  placeholder?: string
}>(), {
  placeholder: 'Add tag...'
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'create-tag': [content: string]
}>()

const searchInput = ref('')
const showDropdown = ref(false)

const selectedTags = computed(() => {
  return props.allTags.filter(tag => props.modelValue.includes(tag.id))
})

const filteredTags = computed(() => {
  const query = searchInput.value.toLowerCase().trim()
  if (!query) {
    return props.allTags.filter(tag => !props.modelValue.includes(tag.id)).slice(0, 5)
  }
  return props.allTags
    .filter(tag =>
      tag.content.toLowerCase().includes(query) &&
      !props.modelValue.includes(tag.id)
    )
    .slice(0, 5)
})

const canCreateNew = computed(() => {
  const query = searchInput.value.trim()
  if (!query) return false
  if (!/^[a-zA-Z0-9-]+$/.test(query)) return false
  return !props.allTags.some(tag => tag.content.toLowerCase() === query.toLowerCase())
})

const removeTag = (tagId: string) => {
  emit('update:modelValue', props.modelValue.filter(id => id !== tagId))
}

const clearAllTags = () => {
  emit('update:modelValue', [])
}

const addTag = (tagId: string) => {
  if (!props.modelValue.includes(tagId)) {
    emit('update:modelValue', [...props.modelValue, tagId])
  }
  searchInput.value = ''
  showDropdown.value = false
}

const handleCreateTag = () => {
  const content = searchInput.value.trim()
  if (content && /^[a-zA-Z0-9-]+$/.test(content)) {
    emit('create-tag', content)
    searchInput.value = ''
    showDropdown.value = false
  }
}

const handleInputFocus = () => {
  showDropdown.value = true
}

const handleInputBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (canCreateNew.value) {
      handleCreateTag()
    } else {
      const firstTag = filteredTags.value[0]
      if (firstTag) {
        addTag(firstTag.id)
      }
    }
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-if="selectedTags.length > 0"
      class="flex flex-wrap gap-2 items-center"
    >
      <span
        v-for="tag in selectedTags"
        :key="tag.id"
        class="badge badge-primary gap-1"
      >
        {{ tag.content }}
        <button
          type="button"
          class="hover:opacity-70"
          @click="removeTag(tag.id)"
        >
          <X :size="14" />
        </button>
      </span>
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square"
        title="Clear all tags"
        @click="clearAllTags"
      >
        <RotateCcw :size="14" />
      </button>
    </div>

    <div class="relative">
      <input
        v-model="searchInput"
        type="text"
        class="input input-sm w-full"
        :placeholder="placeholder"
        pattern="[a-zA-Z0-9-]*"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        @keydown="handleKeydown"
      >

      <div
        v-if="showDropdown && (filteredTags.length > 0 || canCreateNew)"
        class="absolute z-10 mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg"
      >
        <ul class="menu menu-sm p-1">
          <li
            v-for="tag in filteredTags"
            :key="tag.id"
          >
            <button
              type="button"
              @mousedown.prevent="addTag(tag.id)"
            >
              {{ tag.content }}
            </button>
          </li>
          <li v-if="canCreateNew">
            <button
              type="button"
              class="text-primary"
              @mousedown.prevent="handleCreateTag"
            >
              Create "{{ searchInput.trim() }}"
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
