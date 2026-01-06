<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <main class="flex-1 container mx-auto p-4 flex flex-col">
      <RouterView />
    </main>
    <footer class="border-t border-base-300 bg-base-100">
      <nav class="container mx-auto p-4 flex items-center justify-center gap-4">
        <RouterLink
          to="/practice"
          class="btn btn-ghost btn-sm"
        >
          Practice
        </RouterLink>
        <RouterLink
          to="/topic-practice"
          class="btn btn-ghost btn-sm"
        >
          Topic Practice
        </RouterLink>
        <RouterLink
          to="/topics"
          class="btn btn-ghost btn-sm"
        >
          Topics
        </RouterLink>
      </nav>
    </footer>
  </div>
</template>


<style>
@import "tailwindcss";
@plugin "daisyui";
@plugin "@tailwindcss/typography";
</style>
