<script setup lang="ts">
defineProps<{ inverse?: boolean }>();
</script>

<template>
  <footer class="slide-footer">
    <img
      :src="inverse ? '/brand/sdworx-mark-white.svg' : '/brand/sdworx-mark.svg'"
      alt=""
    />
    <span>{{ $slidev.nav.currentPage }}</span>
  </footer>
</template>
