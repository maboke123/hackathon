<template>
  <div class="slidev-layout section inverse">
    <div class="section-body">
      <slot />
    </div>
    <SlideFooter inverse />
  </div>
</template>

<style scoped>
.section {
  display: flex;
  align-items: center;
}

.section :deep(h1) {
  font-size: 3.5rem;
  line-height: 1.05;
  max-width: 40rem;
}
</style>
