<template>
  <div class="slidev-layout cover inverse">
    <img class="cover-logo" src="/brand/sdworx-logo-white.svg" alt="SD Worx" />
    <div class="cover-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.cover {
  display: flex;
  flex-direction: column;
}

.cover-logo {
  height: 2rem;
  align-self: flex-start;
}

.cover-body {
  margin-top: auto;
  margin-bottom: auto;
}

.cover :deep(h1) {
  font-size: 4rem;
  line-height: 1.05;
  max-width: 44rem;
}

.cover :deep(p) {
  font-size: 1.375rem;
  color: var(--ds-blue-300);
  text-wrap: balance;
}
</style>
