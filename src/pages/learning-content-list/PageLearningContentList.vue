<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, Pencil, Trash2, Plus } from 'lucide-vue-next'
import { loadLearningContent, deleteLearningContent, createLearningContent } from '@/entities/learning-content/learningContentStore'
import LearningContentRenderer from '@/entities/learning-content/LearningContentRenderer.vue'
import ZipUploadButton from './ZipUploadButton.vue'
import { parseLearningContentFromZip } from './importHelpers'
import type { LearningContentDoc } from '@/entities/learning-content/LearningContent'

const router = useRouter()
const items = ref<LearningContentDoc[]>([])
const viewModalContent = ref<string>('')
const showViewModal = ref(false)
const uploading = ref(false)

onMounted(async () => {
  items.value = await loadLearningContent()
})

const handleAdd = () => {
  router.push('/learning-content/add')
}

const handleEdit = (id: string) => {
  router.push(`/learning-content/${id}/edit`)
}

const handleView = (content: string) => {
  viewModalContent.value = content
  showViewModal.value = true
}

const handleDelete = async (id: string) => {
  if (!confirm('Delete this learning content?')) return
  await deleteLearningContent(id)
  items.value = await loadLearningContent()
}

const closeModal = () => {
  showViewModal.value = false
}

const handleZipUpload = async (file: File) => {
  uploading.value = true
  try {
    const parsed = await parseLearningContentFromZip(file)
    for (const { content } of parsed) {
      await createLearningContent(content)
    }
    items.value = await loadLearningContent()
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Learning Content
    </h1>

    <div class="flex gap-2 mb-4">
      <button
        class="btn btn-primary"
        @click="handleAdd"
      >
        <Plus :size="20" />
        Add Learning Content
      </button>
      <ZipUploadButton
        :loading="uploading"
        @file="handleZipUpload"
      />
    </div>

    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Content</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item._id"
          >
            <td class="truncate max-w-md">
              {{ item.content }}
            </td>
            <td>
              <div class="flex gap-2">
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleView(item.content)"
                >
                  <Eye :size="16" />
                </button>
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleEdit(item._id)"
                >
                  <Pencil :size="16" />
                </button>
                <button
                  class="btn btn-sm btn-ghost"
                  @click="handleDelete(item._id)"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog
      :open="showViewModal"
      class="modal"
    >
      <div class="modal-box">
        <LearningContentRenderer :content="viewModalContent" />
        <div class="modal-action">
          <button
            class="btn"
            @click="closeModal"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>
