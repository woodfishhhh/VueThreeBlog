<script setup lang="ts">
import { computed, shallowRef, useTemplateRef } from "vue";

import { useMatterCapsules } from "@/composables/useMatterCapsules";
import type { AuthorProfileData } from "@/types/content";

const props = defineProps<{
  active: boolean;
  skills: AuthorProfileData["skills"];
}>();

const sceneRef = useTemplateRef<HTMLElement>("scene");
const skillsRef = shallowRef(props.skills);
const activeRef = computed(() => props.active);

const { activateSkill } = useMatterCapsules({
  active: activeRef,
  sceneRef,
  skills: skillsRef,
});
</script>

<template>
  <section class="author-screen author-screen--fullbleed" data-author-screen data-testid="author-screen-capsules">
    <div class="author-screen__shell">
      <article class="author-screen__panel author-screen__panel--poster author-screen__panel--capsules">
        <div ref="scene" class="author-capsules__field" data-author-reveal>
          <button
            aria-label="释放技术栈标题"
            class="author-capsules__title"
            data-author-capsule
            data-author-fixed
            data-author-title
            type="button"
            @click="activateSkill(0)"
          >
            <span>Stack</span>
            <strong>技术栈</strong>
          </button>

          <button
            v-for="(skill, index) in props.skills"
            :key="skill.title"
            :aria-label="skill.title"
            class="author-capsule"
            data-author-capsule
            type="button"
            @click="activateSkill(index + 1)"
          >
            <img
              v-if="skill.img"
              :alt="skill.title"
              :src="skill.img"
              class="author-capsule__icon"
            />
            <span class="author-capsule__label">{{ skill.title }}</span>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.author-screen__panel--capsules {
  justify-content: stretch;
  padding: 0;
  /* Subtle scene-level atmosphere */
  background: var(--author-capsule-scene-bg);
}

.author-capsules__field {
  position: relative;
  overflow: hidden;
  width: 100%;
  flex: 1;
  min-height: 0;
  /* Reserve space for SiteNav and avoid overlap with content */
  padding-top: env(safe-area-inset-top, 0px);
  cursor: grab;
}

.author-capsules__field::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 22%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03), transparent 42%);
  pointer-events: none;
}

.author-capsules__title,
.author-capsule {
  position: absolute;
  top: 0;
  left: 0;
  border: 1px solid var(--author-capsule-border);
  background: var(--author-capsule-bg);
  box-shadow: var(--author-capsule-shadow);
  backdrop-filter: blur(10px);
  color: var(--stage-fg);
  cursor: grab;
  user-select: none;
  touch-action: none;
  will-change: transform;
}

.author-capsules__title:active,
.author-capsule:active {
  cursor: grabbing;
}

.author-capsules__title {
  display: grid;
  min-width: 18rem;
  padding: 1.1rem 1.25rem 1.35rem;
  text-align: left;
}

.author-capsules__title span {
  font-size: 0.74rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--stage-hint);
}

.author-capsules__title strong {
  margin-top: 0.55rem;
  font-size: 4.5rem;
  font-weight: 700;
  line-height: 0.92;
}

.author-capsule {
  display: inline-flex;
  align-items: center;
  gap: 0.72rem;
  min-width: 7rem;
  padding: 0.84rem 1.18rem;
  border-radius: 999px;
}

.author-capsule__icon {
  width: 1.2rem;
  height: 1.2rem;
  object-fit: contain;
  flex-shrink: 0;
}

.author-capsule__label {
  font-size: 0.9rem;
  line-height: 1;
  white-space: nowrap;
  color: var(--author-capsule-text);
}

@media (max-width: 767px) {
  .author-capsules__title {
    min-width: 13rem;
    padding: 0.9rem 1rem 1.05rem;
  }

  .author-capsules__title strong {
    font-size: 3rem;
  }

  .author-capsule {
    min-width: 5.8rem;
    padding: 0.72rem 0.92rem;
  }
}
</style>
