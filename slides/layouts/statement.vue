<template>
  <div class="slidev-layout statement">
    <div class="statement-body">
      <slot />
    </div>
    <SlideFooter />
  </div>
</template>

<style scoped>
.statement {
  display: flex;
  align-items: center;
}

.statement :deep(h1) {
  font-size: 3.25rem;
  line-height: 1.1;
  max-width: 48rem;
}

.statement :deep(h1 em) {
  font-style: normal;
  color: var(--primary);
}
</style>
