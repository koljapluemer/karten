## Task.vue

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import ShowInstruction from '../../elements/ShowInstruction.vue'
import IndexCard from '../../elements/IndexCard.vue'
import InteractionButtonRow from '../../elements/InteractionButtonRow.vue'
import type { IndexCardRow } from '../../elements/types'
import type { RecallFromTargetTask } from './interface'

defineOptions({ name: 'RecallFromTargetTask' })

const props = defineProps<{
  task: RecallFromTargetTask
}>()

const emit = defineEmits<{
  (e: 'taskDone', rememberedCorrectly?: boolean): void
}>()

const phase = ref<'prompt' | 'reveal'>('prompt')
const flipped = ref(false)

const cardRows = computed<IndexCardRow[]>(() => {
  if (phase.value === 'prompt') {
    return [{ type: 'text', text: props.task.gloss.content, size: 'auto' }]
  }

  const translationRows = props.task.translations.map(translation => (
    { type: 'text', text: translation.content, size: 'auto' } as IndexCardRow
  ))

  return [
    { type: 'text', text: props.task.gloss.content, size: 'auto' },
    { type: 'divider' },
    ...translationRows
  ]
})

const handleFlip = () => {
  flipped.value = true
  phase.value = 'reveal'
}

const handleDone = (icon: string) => emit('taskDone', icon === 'Check')
</script>

<template>
  <div class="w-full max-w-xl flex flex-col min-h-[70vh] gap-4">
    <div>
      <ShowInstruction
        v-if="phase === 'prompt'"
        content="Do you remember what this means?"
      />
    </div>

    <div class="flex-1 flex flex-col gap-4 items-center overflow-auto">
      <IndexCard
        :rows="cardRows"
        :flipped="flipped"
        fill
      />
    </div>

    <div class="mt-auto flex justify-center">
      <InteractionButtonRow
        v-if="phase === 'prompt'"
        :icons="['RefreshCw']"
        @select="handleFlip"
      />

      <InteractionButtonRow
        v-else
        :icons="['Check', 'X']"
        @select="handleDone"
      />
    </div>
  </div>
</template>

```

## InteractionButton Row

```vue
<script setup lang="ts">
import * as Icons from 'lucide-vue-next'

const props = defineProps<{
  icons: string[]
}>()

const emit = defineEmits<{
  (e: 'select', value: string): void
}>()

const handleClick = (icon: string) => emit('select', icon)
</script>

<template>
  <div class="flex gap-2 justify-center">
    <button
      v-for="icon in props.icons"
      :key="icon"
      class="btn btn-circle  btn-xl"
      type="button"
      @click="handleClick(icon)"
    >
      <component
        :is="(Icons as Record<string, unknown>)[icon] ?? Icons.HelpCircle"
        class="w-6 h-6"
      />
    </button>
  </div>
</template>

```

## IndexCard

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { IndexCardRow } from './types'

const props = defineProps<{
  rows: IndexCardRow[]
  flipped?: boolean
  swiped?: boolean
  fill?: boolean
}>()

const cardClasses = computed(() => [
  'card',
  'shadow',
  'bg-white',
  'text-gray-700',
  'w-full',
  props.fill && 'h-full',
  props.flipped && 'card-flipped',
  props.swiped && 'card-swiped'
])

const textClass = (row: IndexCardRow) => {
  if (row.type === 'divider') return ''

  if (row.size === 'small') return 'text-sm text-light'

  if (row.size === 'auto') {
    const length = row.text.length
    if (length < 3) return 'text-7xl font-bold'
    if (length < 20) return 'text-5xl font-bold'
    return 'text-3xl font-semibold'
  }

  return 'text-xl'
}
</script>

<template>
  <div :class="cardClasses">
    <div class="card-body gap-4 grid place-items-center text-center mb-8">
      <template
        v-for="(row, index) in rows"
        :key="index"
      >
        <div
          v-if="row.type === 'divider'"
          class="w-full border-b-2 border-dotted"
        />
        <p
          v-else
          :class="textClass(row)"
        >
          {{ row.text }}
        </p>
      </template>
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

.card-swiped {
  animation: swipeCard 0.35s ease forwards;
}

@keyframes swipeCard {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(60%);
    opacity: 0;
  }
}
</style>


```