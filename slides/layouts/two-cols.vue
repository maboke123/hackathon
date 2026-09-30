<template>
  <div class="slidev-layout two-cols">
    <slot />
    <div class="cols">
      <div><slot name="left" /></div>
      <div><slot name="right" /></div>
    </div>
    <SlideFooter />
  </div>
</template>

<style scoped>
.cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
}
</style>
