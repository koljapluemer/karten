<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Trash2, Pencil, Settings } from 'lucide-vue-next'
import { useTopicsStore } from '@/entities/topics/topicsStore'

const router = useRouter()
const topicsStore = useTopicsStore()

const newName = ref('')
const editingId = ref<string | null>(null)
const editValue = ref('')

const topics = computed(() => topicsStore.topics)

const parseName = (raw: string): string[] =>
  raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

const handleAdd = async () => {
  const nameParts = parseName(newName.value)
  if (!nameParts.length) return
  await topicsStore.createTopic(nameParts)
  newName.value = ''
}

const startEdit = (topicId: string, current: string[]) => {
  editingId.value = topicId
  editValue.value = current.join(', ')
}

const saveEdit = async () => {
  if (!editingId.value) return
  const nameParts = parseName(editValue.value)
  if (!nameParts.length) return
  await topicsStore.updateTopic(editingId.value, { name: nameParts })
  editingId.value = null
}

const cancelEdit = () => {
  editingId.value = null
  editValue.value = ''
}

const removeTopic = async (topicId: string) => {
  await topicsStore.deleteTopic(topicId)
}

const goManage = (topicId: string) => {
  router.push({ name: 'topic-manage', params: { id: topicId } })
}

onMounted(() => {
  topicsStore.loadTopics()
})
</script>

<template>
  <div class="w-full max-w-4xl space-y-6">
    <h1 class="text-2xl font-semibold">
      Topics
    </h1>

    <div class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th class="text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!topics.length">
            <td
              colspan="2"
              class="text-center opacity-70"
            >
              No topics yet.
            </td>
          </tr>
          <tr
            v-for="topic in topics"
            :key="topic._id"
          >
            <td>
              <div
                v-if="editingId === topic._id"
                class="space-y-2"
              >
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Topic Name</span>
                  </label>
                  <input
                    v-model="editValue"
                    class="input input-bordered w-full"
                    placeholder="Topic name"
                  >
                </div>
                <div class="flex gap-2">
                  <button
                    class="btn btn-primary btn-sm"
                    @click="saveEdit"
                  >
                    Save
                  </button>
                  <button
                    class="btn btn-ghost btn-sm"
                    @click="cancelEdit"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <div v-else>
                {{ topic.name.join(' / ') }}
              </div>
            </td>
            <td>
              <div class="flex justify-end gap-2">
                <button
                  class="btn btn-ghost btn-square"
                  aria-label="Manage"
                  @click="goManage(topic._id)"
                >
                  <Settings :size="18" />
                </button>
                <button
                  class="btn btn-ghost btn-square"
                  aria-label="Edit"
                  @click="startEdit(topic._id, topic.name)"
                >
                  <Pencil :size="18" />
                </button>
                <button
                  class="btn btn-ghost btn-square text-error"
                  aria-label="Delete"
                  @click="removeTopic(topic._id)"
                >
                  <Trash2 :size="18" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="space-y-2">
      <label class="label">
        <span class="label-text">Add Topic</span>
      </label>
      <div class="flex flex-col gap-2 sm:flex-row">
        <input
          v-model="newName"
          class="input input-bordered w-full"
          placeholder="Topic name"
        >
        <button
          class="btn btn-primary"
          @click="handleAdd"
        >
          Add
        </button>
      </div>
    </div>
  </div>
</template>
