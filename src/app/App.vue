<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { Settings, Play, BookOpen, Layers, ChartBarBig, MessageSquareText, Tag, Wind } from 'lucide-vue-next'
import { initializeAuth } from '@/entities/auth/authStore'
import ToastContainer from './toast/ToastContainer.vue'

const route = useRoute()
const isFloatPage = computed(() => route.name === 'float')

onMounted(() => {
  initializeAuth()
})
</script>

<template>
  <div class="flex flex-col justify-between items-center w-full h-full overflow-x-hidden">
    <nav class="navbar bg-base-200">
      <div class="flex-1">
        <div class="flex gap-1 overflow-x-auto">
          <RouterLink
            to="/practice"
            class="btn btn-ghost"
          >
            <Play />
            <span class="hidden sm:inline">Practice</span>
          </RouterLink>
          <RouterLink
            to="/learning-content"
            class="btn btn-ghost"
          >
            <BookOpen />
            <span class="hidden sm:inline">Learning Content</span>
          </RouterLink>
          <RouterLink
            to="/flashcards"
            class="btn btn-ghost"
          >
            <Layers />
            <span class="hidden sm:inline">Flashcards</span>
          </RouterLink>
          <RouterLink
            to="/stats"
            class="btn btn-ghost"
          >
            <ChartBarBig />
            <span class="hidden sm:inline">Stats</span>
          </RouterLink>
          <RouterLink
            to="/prompts"
            class="btn btn-ghost"
          >
            <MessageSquareText />
            <span class="hidden sm:inline">Prompts</span>
          </RouterLink>
          <RouterLink
            to="/tags"
            class="btn btn-ghost"
          >
            <Tag />
            <span class="hidden sm:inline">Tags</span>
          </RouterLink>
          <RouterLink
            to="/float"
            class="btn btn-ghost"
          >
            <Wind />
            <span class="hidden sm:inline">Float</span>
          </RouterLink>
        </div>
      </div>
      <div class="flex-none">
        <RouterLink
          to="/settings"
          class="btn btn-ghost"
        >
          <Settings />
          <span class="hidden sm:inline">Settings</span>
        </RouterLink>
      </div>
    </nav>
    <main
      class="flex-1 flex flex-col justify-center w-full mx-auto"
      :class="isFloatPage ? 'relative' : 'max-w-4xl px-4'"
    >
      <RouterView />
    </main>
    <ToastContainer />
  </div>
</template>


<style>
@import "tailwindcss";
@plugin "daisyui";
</style>
