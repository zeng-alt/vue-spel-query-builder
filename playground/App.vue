<script setup lang="ts">
import SpelEditorExample from './SpelEditorExample.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-8 px-6 text-center shadow-md">
      <h1 class="text-3xl font-bold mb-2">Vue SpEL Query Builder</h1>
      <p class="text-base opacity-90">基于 Vue 3 + SpEL + CodeMirror + Naive UI 的在线编辑器和可视化规则树 UI</p>
    </header>
    
    <main class="flex-1 bg-white m-6 rounded-xl shadow-sm overflow-hidden">
      <SpelEditorExample />
    </main>
    
    <footer class="bg-gray-50 py-4 text-center text-gray-500 text-sm">
      <p>© 2024 Vue SpEL Query Builder</p>
    </footer>
  </div>
</template>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f0f2f5;
  min-height: 100vh;
}
</style>
