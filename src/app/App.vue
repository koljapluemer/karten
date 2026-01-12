<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import ToastContainer from './toast/ToastContainer.vue'
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <nav class="navbar bg-base-200">
      <div class="flex gap-4">
        <RouterLink
          to="/learning-content"
          class="btn btn-ghost"
        >
          Learning Content
        </RouterLink>
        <RouterLink
          to="/flashcards"
          class="btn btn-ghost"
        >
          Flashcards
        </RouterLink>
      </div>
    </nav>
    <main class="flex-1 container mx-auto p-4 flex flex-col">
      <RouterView />
    </main>
    <ToastContainer />
  </div>
</template>


<style>
@import "tailwindcss";
@plugin "daisyui";
@plugin "@tailwindcss/typography";
</style>
