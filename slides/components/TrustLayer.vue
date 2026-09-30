<script setup lang="ts">
defineProps<{ step: number }>();

const sources = [
  "SharePoint",
  "OneDrive",
  "Outlook",
  "Teams",
  "Call notes",
  "Tickets",
];
const signals = [
  ["Owner", "Who answers for it, and are they still here"],
  ["Last check", "Reviewed, not just modified"],
  ["Scope", "Country, customer, team, product"],
  ["Typed links", "Replaces, contradicts, copy of"],
];
</script>

<template>
  <div class="layer" :class="{ inserted: step >= 1 }">
    <div class="rail" aria-hidden="true">
      <span class="rail-line" />
      <span class="rail-head" />
    </div>

    <section class="col sources">
      <h4>Your knowledge</h4>
      <ul class="chips">
        <li v-for="source in sources" :key="source" class="label">
          {{ source }}
        </li>
      </ul>
      <p class="note">
        Thousands of files, no owner, no date that means anything
      </p>
    </section>

    <section class="col graph">
      <h4>Trust graph</h4>
      <dl>
        <div v-for="[name, detail] in signals" :key="name">
          <dt>{{ name }}</dt>
          <dd>{{ detail }}</dd>
        </div>
      </dl>
      <p class="note">Conflicts it cannot settle go to the owner</p>
    </section>

    <section class="col agent">
      <h4>Existing agent</h4>
      <p>The one SD Worx already has. We do not replace it.</p>
    </section>

    <section class="col person">
      <h4>Service colleague</h4>
      <p v-if="step < 1" class="outcome bad">Four documents, and a guess</p>
      <p v-else class="outcome ok">
        One answer, and why the others were not used
      </p>
    </section>
  </div>
</template>

<style scoped>
.layer {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1.35fr 1fr 1fr;
  gap: 2.5rem;
  align-items: center;
  margin-top: 2.5rem;
}

.rail {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 0;
}

.rail-line {
  position: absolute;
  left: 2rem;
  right: 0.5rem;
  border-top: 2px solid var(--ds-neutral-300);
}

.rail-head {
  position: absolute;
  right: 0;
  top: -6px;
  border-left: 10px solid var(--ds-neutral-300);
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

.col {
  position: relative;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--background);
  padding: 1.1rem 1.2rem;
  font-size: 0.95rem;
  line-height: 1.4;
}

.col h4 {
  font-family: var(--ds-font-heading);
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--heading);
  margin: 0 0 0.6rem;
}

.col p {
  margin: 0;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0 0 0.8rem;
}

.chips li {
  padding: 0.1rem 0.45rem;
  margin: 0;
}

.chips li::before {
  display: none;
}

.note {
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

.agent p,
.person p {
  color: var(--muted-foreground);
}

.graph {
  border: 2px solid var(--primary);
  background: var(--ds-blue-50);
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 500ms cubic-bezier(0.2, 0, 0, 1),
    transform 500ms cubic-bezier(0.2, 0, 0, 1);
}

.inserted .graph {
  opacity: 1;
  transform: translateY(0);
}

.graph h4 {
  color: var(--primary);
}

.graph dl {
  margin: 0 0 0.8rem;
}

.graph dl > div {
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  gap: 0.5rem;
  padding: 0.35rem 0;
  border-top: 1px solid var(--ds-blue-100);
}

.graph dt {
  font-weight: 600;
  color: var(--heading);
}

.graph dd {
  margin: 0;
  color: var(--foreground);
  font-size: 0.85rem;
}

.outcome {
  font-weight: 500;
  padding-left: 0.6rem;
  border-left: 3px solid;
  animation: fade-in 400ms cubic-bezier(0.2, 0, 0, 1) both;
}

.person .outcome.bad {
  border-color: var(--ds-red-500);
  color: var(--foreground);
}

.person .outcome.ok {
  border-color: var(--primary);
  color: var(--heading);
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
