<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Pencil, Trash2, Plus } from 'lucide-vue-next'
import { loadPrompts, createPrompt, updatePrompt, deletePrompt } from '@/entities/prompt/promptStore'
import { ensureDefaultPrompts } from '@/entities/prompt/defaultPrompts'
import type { Prompt } from '@/db/Prompt'

const prompts = ref<Prompt[]>([])
const showModal = ref(false)
const editingPrompt = ref<Prompt | null>(null)
const formName = ref('')
const formContent = ref('')

onMounted(async () => {
  await ensureDefaultPrompts()
  prompts.value = await loadPrompts()
})

const openAddModal = () => {
  editingPrompt.value = null
  formName.value = ''
  formContent.value = ''
  showModal.value = true
}

const openEditModal = (prompt: Prompt) => {
  editingPrompt.value = prompt
  formName.value = prompt.name
  formContent.value = prompt.content
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingPrompt.value = null
  formName.value = ''
  formContent.value = ''
}

const handleSave = async () => {
  if (!formName.value.trim() || !formContent.value.trim()) {
    return
  }

  if (editingPrompt.value) {
    await updatePrompt(editingPrompt.value.id, formName.value, formContent.value)
  } else {
    await createPrompt(formName.value, formContent.value)
  }

  prompts.value = await loadPrompts()
  closeModal()
}

const handleDelete = async (id: string) => {
  if (!confirm('Delete this prompt?')) return
  await deletePrompt(id)
  prompts.value = await loadPrompts()
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Prompts
    </h1>

    <div class="flex gap-2 mb-4">
      <button
        class="btn btn-primary"
        @click="openAddModal"
      >
        <Plus />
        Add Prompt
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="prompt in prompts"
            :key="prompt.id"
          >
            <td>{{ prompt.name }}</td>
            <td>
              <div class="flex gap-2">
                <button
                  class="btn btn-sm btn-ghost"
                  @click="openEditModal(prompt)"
                >
                  <Pencil />
                </button>
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleDelete(prompt.id)"
                >
                  <Trash2 />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog
      :open="showModal"
      class="modal"
    >
      <div class="modal-box max-w-2xl">
        <h3 class="text-lg font-semibold mb-4">
          {{ editingPrompt ? 'Edit Prompt' : 'Add Prompt' }}
        </h3>

        <div class="space-y-4">
          <fieldset class="fieldset">
            <label class="label">
              <span class="label-text">Name</span>
            </label>
            <input
              v-model="formName"
              type="text"
              class="input input-bordered w-full"
              placeholder="Prompt name"
            >
          </fieldset>

          <fieldset class="fieldset">
            <label class="label">
              <span class="label-text">Content</span>
            </label>
            <textarea
              v-model="formContent"
              class="textarea textarea-bordered min-h-[200px] w-full"
              placeholder="Prompt content"
            />
            <p class="text-sm opacity-70 mt-2">
              Available magic values:
              <code class="bg-base-200 px-1 rounded">&#123;&#123;flashcard&#125;&#125;</code>,
              <code class="bg-base-200 px-1 rounded">&#123;&#123;front&#125;&#125;</code>,
              <code class="bg-base-200 px-1 rounded">&#123;&#123;back&#125;&#125;</code>,
              <code class="bg-base-200 px-1 rounded">&#123;&#123;learningcontent&#125;&#125;</code>
            </p>
          </fieldset>
        </div>

        <div class="modal-action">
          <button
            class="btn btn-primary"
            :disabled="!formName.trim() || !formContent.trim()"
            @click="handleSave"
          >
            Save
          </button>
          <button
            class="btn btn-ghost"
            @click="closeModal"
          >
            Cancel
          </button>
        </div>
      </div>

      <form
        method="dialog"
        class="modal-backdrop"
        @click.prevent="closeModal"
      >
        <button aria-label="Close">
          close
        </button>
      </form>
    </dialog>
  </div>
</template>
