<script setup lang="ts">
import { computed } from "vue";

import type { AuthorProfileData } from "@/types/content";

const props = defineProps<{
  contacts: AuthorProfileData["contacts"];
}>();

type ContactLink = {
  href: string;
  icon: string;
  label: string;
};

const contactLinks = computed<ContactLink[]>(() => [
  {
    label: "GitHub",
    href: props.contacts.github,
    icon: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22",
  },
  {
    label: "Bilibili",
    href: props.contacts.bilibili,
    icon: "M2 7h20v15H2z M7 2l5 5 5-5",
  },
  {
    label: "QQ",
    href: props.contacts.qq,
    icon: "M12 3c4.8 0 7 3.6 7 8.2 0 2.4-.8 4.5-2.2 6 1 .3 2.5.8 2.5 1.6 0 .8-2.8 1-7.3.6-4.5.4-7.3.2-7.3-.6 0-.8 1.5-1.3 2.5-1.6A8.3 8.3 0 0 1 5 11.2C5 6.6 7.2 3 12 3Z",
  },
  {
    label: "WeChat",
    href: props.contacts.wechat,
    icon: "M9 7c-3.9 0-7 2.6-7 5.8 0 1.8 1 3.4 2.7 4.5L4 20l3-1.6c.6.1 1.3.2 2 .2 3.9 0 7-2.6 7-5.8S12.9 7 9 7Zm8 3c-2.8 0-5 1.9-5 4.2S14.2 18.5 17 18.5c.5 0 1 0 1.5-.2l2.5 1.2-.7-2c1-.8 1.7-2 1.7-3.3C22 11.9 19.8 10 17 10Z",
  },
  {
    label: "Email",
    href: props.contacts.email,
    icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6 12 13 2 6",
  },
  {
    label: "Douyin",
    href: props.contacts.douyin,
    icon: "M14 2c0 3.2 2.3 5.7 5 5.7v3.8c-1.8 0-3.6-.5-5-1.5v6c0 3.3-2.4 6-5.5 6S3 19.3 3 16s2.4-6 5.5-6c.3 0 .7 0 1 .1v3.9a2.4 2.4 0 0 0-1-.2c-1.4 0-2.5 1-2.5 2.2s1.1 2.2 2.5 2.2S11 17.2 11 16V2h3Z",
  },
].filter((link) => link.href));
</script>

<template>
  <div class="author-contact-links">
    <a
      v-for="link in contactLinks"
      :key="link.label"
      :aria-label="link.label"
      :href="link.href"
      class="author-contact-links__item"
      rel="noopener noreferrer"
      :title="link.label"
      target="_blank"
    >
      <svg
        aria-hidden="true"
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.6"
        viewBox="0 0 24 24"
      >
        <path :d="link.icon" />
      </svg>
    </a>
  </div>
</template>

<style scoped>
.author-contact-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.author-contact-links__item {
  display: inline-flex;
  height: 2.8rem;
  width: 2.8rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: var(--author-contact-bg);
  color: var(--stage-hint-strong);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease,
    color 180ms ease;
}

.author-contact-links__item:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  background: var(--author-contact-hover-bg);
  color: var(--stage-fg);
}

@media (max-width: 767px) {
  .author-contact-links {
    gap: 0.65rem;
  }

  .author-contact-links__item {
    height: 2.55rem;
    width: 2.55rem;
  }
}
</style>
