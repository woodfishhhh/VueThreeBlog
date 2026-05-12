<script setup lang="ts">
import { computed, reactive, shallowRef } from "vue";

import { buildFriendLinkIssueUrl, validateFriendLinkInput } from "@/utils/friend-link-issue";

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
  const result = validateFriendLinkInput(draft);

  if (!draft.siteName.trim()) {
    return "请先填写站点名称。";
  }

  if (!draft.siteUrl.trim()) {
    return "请先填写站点链接。";
  }

  if (!result.invalidFields.includes("siteUrl")) {
    // URL 格式合法，但额外检查安全性（防 SSRF / 恶意协议）
    try {
      const parsed = new URL(draft.siteUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "站点链接必须是 http:// 或 https:// 开头的合法地址。";
      }
      if (["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(parsed.hostname)) {
        return "站点链接不能使用本地地址。";
      }
    } catch {
      return "站点链接格式不正确。";
    }
  }

  if (draft.avatarUrl.trim() && !result.invalidFields.includes("avatarUrl")) {
    try {
      const parsed = new URL(draft.avatarUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "头像链接必须是 http:// 或 https:// 开头的合法地址。";
      }
    } catch {
      return "头像链接格式不正确。";
    }
  }

  if (!draft.description.trim()) {
    return "请先填写简短介绍。";
  }

  if (!draft.contact.trim()) {
    return "请先填写称呼或联系方式。";
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
  <section class="friend-application-card">
    <div class="friend-application-card__pin" aria-hidden="true" />
    <div class="friend-application-card__inner">
      <div class="relative max-w-3xl">
        <div class="text-[11px] tracking-[0.18em] text-[var(--stage-hint-strong)]">提交友链</div>
        <h3 class="mt-2 text-2xl font-semibold text-[var(--stage-fg)]">投递你的站点</h3>
        <p class="mt-2 text-sm leading-6 text-[var(--stage-hint)]">
          填完后会先确认，再打开预填好的 GitHub 提交草稿。
      </p>
    </div>

      <form class="relative mt-5 grid gap-3 md:grid-cols-2" @submit.prevent="handleSubmit">
        <label class="space-y-1.5">
          <span class="text-xs tracking-[0.08em] text-[var(--stage-hint)]">站点名称</span>
        <input
          v-model="draft.siteName"
          data-testid="friend-application-site-name"
            class="friend-application-input"
          name="siteName"
          type="text"
            placeholder="你的博客名"
        />
      </label>

        <label class="space-y-1.5">
          <span class="text-xs tracking-[0.08em] text-[var(--stage-hint)]">站点链接</span>
        <input
          v-model="draft.siteUrl"
          data-testid="friend-application-site-url"
            class="friend-application-input"
          name="siteUrl"
          type="url"
          placeholder="https://example.com"
        />
      </label>

        <label class="space-y-1.5">
          <span class="text-xs tracking-[0.08em] text-[var(--stage-hint)]">头像链接</span>
        <input
          v-model="draft.avatarUrl"
          data-testid="friend-application-avatar-url"
            class="friend-application-input"
          name="avatarUrl"
          type="url"
          placeholder="https://example.com/avatar.png"
        />
      </label>

        <label class="space-y-1.5">
          <span class="text-xs tracking-[0.08em] text-[var(--stage-hint)]">称呼或联系方式</span>
        <input
          v-model="draft.contact"
          data-testid="friend-application-contact"
            class="friend-application-input"
          name="contact"
          type="text"
          placeholder="@woodfishhhh"
        />
      </label>

        <label class="space-y-1.5 md:col-span-2">
          <span class="text-xs tracking-[0.08em] text-[var(--stage-hint)]">简短介绍</span>
        <textarea
          v-model="draft.description"
          data-testid="friend-application-description"
            class="friend-application-input min-h-24 leading-6"
          name="description"
            placeholder="写一句网站主题或你想说的话。"
        />
      </label>

        <div class="md:col-span-2 flex flex-col gap-3">
          <p v-if="validationMessage" class="text-sm text-amber-500">
          {{ validationMessage }}
        </p>

        <div class="flex flex-wrap items-center gap-3">
          <button
            data-testid="friend-application-submit"
              class="friend-application-submit"
            type="button"
            @click="handleSubmit"
          >
              生成提交草稿
          </button>
            <span class="text-xs text-[var(--stage-hint)]">仅前端生成，不需要令牌。</span>
        </div>
      </div>
    </form>

      <div
        v-if="showReminder"
        data-testid="friend-application-reminder"
        class="friend-application-reminder"
      >
        <div class="text-[11px] tracking-[0.16em] text-[var(--stage-hint-strong)]">确认跳转</div>
        <p class="mt-2 text-sm leading-6 text-[var(--stage-hint)]">
          将打开 GitHub 提交草稿，你可以检查内容后再提交。
      </p>
      <div class="mt-4 flex flex-wrap gap-3">
        <button
          data-testid="friend-application-confirm"
            class="friend-application-submit"
          type="button"
          @click="confirmIssueRedirect"
        >
          继续前往 GitHub
        </button>
        <button
            class="friend-application-secondary"
          type="button"
          @click="closeReminder"
        >
          再检查一下
        </button>
      </div>
    </div>
    </div>
  </section>
</template>

<style scoped>
.friend-application-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(76, 61, 43, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 253, 246, 0.62), rgba(244, 235, 217, 0.38)),
    var(--surface-soft);
  box-shadow: 0 24px 52px rgba(37, 28, 16, 0.16);
  backdrop-filter: blur(18px) saturate(155%);
  -webkit-backdrop-filter: blur(18px) saturate(155%);
}

.friend-application-card__inner {
  position: relative;
  z-index: 1;
  padding: 1.2rem;
}

.friend-application-card__pin {
  position: absolute;
  top: 0.7rem;
  left: 50%;
  z-index: 2;
  height: 0.6rem;
  width: 0.6rem;
  border-radius: 999px;
  background: rgba(155, 101, 24, 0.42);
  box-shadow: 0 2px 8px rgba(37, 28, 16, 0.24);
  transform: translateX(-50%);
}

.friend-application-input {
  width: 100%;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.36);
  padding: 0.55rem 0.7rem;
  color: var(--stage-fg);
  font-size: 0.82rem;
  outline: none;
  transition: border-color 160ms ease, background 160ms ease;
}

.friend-application-input:focus {
  border-color: var(--border-strong);
  background: rgba(255, 255, 255, 0.5);
}

.friend-application-submit,
.friend-application-secondary {
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 0.58rem 0.86rem;
  font-size: 0.82rem;
  transition: border-color 180ms ease, color 180ms ease, background 180ms ease;
}

.friend-application-submit {
  background: rgba(53, 88, 204, 0.12);
  color: var(--stage-fg);
}

.friend-application-secondary {
  color: var(--stage-hint);
}

.friend-application-submit:hover,
.friend-application-secondary:hover {
  border-color: var(--border-strong);
  color: var(--stage-fg);
}

.friend-application-reminder {
  position: relative;
  margin-top: 1rem;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.22);
  padding: 0.95rem;
}

:root[data-theme="night"] .friend-application-card {
  border-color: var(--border-subtle);
  background:
    linear-gradient(135deg, rgba(18, 24, 40, 0.38), rgba(8, 12, 24, 0.26)),
    var(--surface-soft);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(20px) saturate(155%);
  -webkit-backdrop-filter: blur(20px) saturate(155%);
}

:root[data-theme="night"] .friend-application-card__pin {
  background: rgba(138, 178, 255, 0.44);
}

:root[data-theme="night"] .friend-application-input,
:root[data-theme="night"] .friend-application-reminder {
  background: rgba(8, 12, 24, 0.34);
}

@media (min-width: 768px) {
  .friend-application-card__inner {
    padding: 1.35rem;
  }
}
</style>
