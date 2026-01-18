<script setup lang="ts">
import { computed } from 'vue'
import MarkdownContent from '@/dumb/MarkdownContent.vue'

const props = defineProps<{
  front: string
  back: string
  showBack?: boolean
  flipped?: boolean
}>()

const cardClasses = computed(() => [
  'card',
  'shadow',
  'bg-white',
  'text-gray-900',
  'w-full',
  props.flipped && 'card-flipped'
])
</script>

<template>
  <div
    :class="cardClasses"
    data-theme="light"
  >
    <div class="card-body gap-4">
      <div class="w-full">
        <MarkdownContent :value="front" />
      </div>
      <div
        v-if="props.showBack"
        class="w-full border-t-2 border-dotted border-base-300 pt-4"
      >
        <MarkdownContent :value="back" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.card-flipped {
  animation: flipCard 0.4s ease;
}

@keyframes flipCard {
  0% {
    transform: rotateY(0deg);
  }

  50% {
    transform: rotateY(90deg);
  }

  100% {
    transform: rotateY(0deg);
  }
}
</style>
