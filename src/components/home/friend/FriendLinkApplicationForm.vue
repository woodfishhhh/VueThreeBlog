<script setup lang="ts">
import { computed, reactive, shallowRef } from "vue";

import { buildFriendLinkIssueUrl } from "@/utils/friend-link-issue";

interface FriendLinkApplicationDraft {
  siteName: string;
  siteUrl: string;
  avatarUrl: string;
  description: string;
  contact: string;
}

const draft = reactive<FriendLinkApplicationDraft>({
  siteName: "",
  siteUrl: "",
  avatarUrl: "",
  description: "",
  contact: "",
});

const showReminder = shallowRef(false);

const validationMessage = computed(() => {
  if (!draft.siteName.trim()) {
    return "请先填写 Site Name。";
  }

  if (!draft.siteUrl.trim()) {
    return "请先填写 Site URL。";
  }

  if (!draft.avatarUrl.trim()) {
    return "请先填写 Avatar URL。";
  }

  if (!draft.description.trim()) {
    return "请先填写 Short Description。";
  }

  if (!draft.contact.trim()) {
    return "请先填写 Your Name / Contact。";
  }

  return "";
});

const issueUrl = computed(() =>
  buildFriendLinkIssueUrl({
    siteName: draft.siteName,
    siteUrl: draft.siteUrl,
    avatarUrl: draft.avatarUrl,
    description: draft.description,
    contact: draft.contact,
  }),
);

function handleSubmit() {
  if (validationMessage.value) {
    return;
  }

  showReminder.value = true;
}

function closeReminder() {
  showReminder.value = false;
}

function confirmIssueRedirect() {
  window.open(issueUrl.value, "_blank", "noopener,noreferrer");
  showReminder.value = false;
}
</script>

<template>
  <section class="rounded-[32px] border border-white/12 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
    <div class="max-w-3xl">
      <div class="text-[11px] uppercase tracking-[0.36em] text-cyan-200/65">Apply For Link Exchange</div>
      <h3 class="mt-3 text-3xl font-light text-white">投递你的星球坐标</h3>
      <p class="mt-3 text-sm leading-7 text-white/60">
        填完这张卡片后，我们会先提醒你即将跳到 GitHub issue 页面，再带着预填信息过去完成提交。
      </p>
    </div>

    <form class="mt-6 grid gap-4 md:grid-cols-2" @submit.prevent="handleSubmit">
      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.22em] text-white/45">Site Name</span>
        <input
          v-model="draft.siteName"
          data-testid="friend-application-site-name"
          class="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-300/55"
          type="text"
          placeholder="Orbiting Notes"
        />
      </label>

      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.22em] text-white/45">Site URL</span>
        <input
          v-model="draft.siteUrl"
          data-testid="friend-application-site-url"
          class="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-300/55"
          type="url"
          placeholder="https://example.com"
        />
      </label>

      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.22em] text-white/45">Avatar URL</span>
        <input
          v-model="draft.avatarUrl"
          data-testid="friend-application-avatar-url"
          class="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-300/55"
          type="url"
          placeholder="https://example.com/avatar.png"
        />
      </label>

      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.22em] text-white/45">Your Name / Contact</span>
        <input
          v-model="draft.contact"
          data-testid="friend-application-contact"
          class="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-300/55"
          type="text"
          placeholder="@woodfishhhh"
        />
      </label>

      <label class="space-y-2 md:col-span-2">
        <span class="text-xs uppercase tracking-[0.22em] text-white/45">Short Description</span>
        <textarea
          v-model="draft.description"
          data-testid="friend-application-description"
          class="min-h-32 w-full rounded-3xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-7 text-white outline-none transition-colors focus:border-cyan-300/55"
          placeholder="介绍一下你的网站主题、风格和主要内容。"
        />
      </label>

      <div class="md:col-span-2 flex flex-col gap-3">
        <p v-if="validationMessage" class="text-sm text-amber-200/80">
          {{ validationMessage }}
        </p>

        <div class="flex flex-wrap items-center gap-3">
          <button
            data-testid="friend-application-submit"
            class="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 py-3 text-sm text-cyan-100 transition-colors hover:border-cyan-200/80 hover:bg-cyan-300/16"
            type="button"
            @click="handleSubmit"
          >
            生成 GitHub issue
          </button>
          <span class="text-xs uppercase tracking-[0.2em] text-white/35">Pure frontend · no token · issue draft only</span>
        </div>
      </div>
    </form>

    <div
      v-if="showReminder"
      data-testid="friend-application-reminder"
      class="mt-5 rounded-[28px] border border-fuchsia-300/25 bg-fuchsia-400/8 p-5"
    >
      <div class="text-[11px] uppercase tracking-[0.32em] text-fuchsia-100/70">Reminder</div>
      <p class="mt-3 text-sm leading-7 text-white/75">
        即将跳到 GitHub issue 页面提交。确认后会打开预填好的 issue 草稿，你可以在 GitHub 页面做最后检查再正式提交。
      </p>
      <div class="mt-4 flex flex-wrap gap-3">
        <button
          data-testid="friend-application-confirm"
          class="rounded-full border border-fuchsia-200/45 bg-fuchsia-300/14 px-4 py-2 text-sm text-fuchsia-50 transition-colors hover:border-fuchsia-100/80"
          type="button"
          @click="confirmIssueRedirect"
        >
          继续前往 GitHub
        </button>
        <button
          class="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white"
          type="button"
          @click="closeReminder"
        >
          再检查一下
        </button>
      </div>
    </div>
  </section>
</template>
