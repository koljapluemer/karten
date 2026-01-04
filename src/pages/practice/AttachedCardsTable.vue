<script setup lang="ts">
import { Link2Off, Pencil, Trash2 } from 'lucide-vue-next'
import type { FlashCardDoc } from '@/entities/flashcards/FlashCard'

const props = defineProps<{
  items: FlashCardDoc[]
  showDetach?: boolean
}>()

const emit = defineEmits<{
  (event: 'edit', card: FlashCardDoc): void
  (event: 'detach', card: FlashCardDoc): void
  (event: 'delete', card: FlashCardDoc): void
}>()
</script>

<template>
  <div class="overflow-x-auto">
    <table class="table table-zebra w-full">
      <thead>
        <tr>
          <th>Card</th>
          <th class="text-right">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!props.items.length">
          <td
            colspan="2"
            class="text-center opacity-70"
          >
            Nothing added yet.
          </td>
        </tr>
        <tr
          v-for="card in props.items"
          :key="card._id"
        >
          <td class="whitespace-pre-wrap">
            {{ card.front }}
          </td>
          <td>
            <div class="flex items-center justify-end gap-2">
              <button
                class="btn  btn-square"
                aria-label="Edit"
                @click="emit('edit', card)"
              >
                <Pencil :size="16" />
              </button>
              <button
                v-if="props.showDetach"
                class="btn  btn-square"
                aria-label="Detach"
                @click="emit('detach', card)"
              >
                <Link2Off :size="16" />
              </button>
              <button
                class="btn  btn-square text-error"
                aria-label="Delete"
                @click="emit('delete', card)"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
