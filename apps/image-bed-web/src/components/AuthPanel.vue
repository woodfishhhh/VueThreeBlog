<script setup lang="ts">
import { shallowRef } from "vue";
import Icon from "./Icon.vue";

interface RegisterForm {
  displayName: string;
  email: string;
  inviteCode: string;
}

defineProps<{
  busy: boolean;
  endpoint: string;
  error: string;
  registerForm: RegisterForm;
}>();

const emit = defineEmits<{
  login: [];
  register: [];
}>();

const tokenDraft = defineModel<string>("tokenDraft", { required: true });
const mode = shallowRef<"token" | "invite">("token");
</script>

<template>
  <section class="auth-panel" aria-labelledby="auth-title">
    <div class="auth-panel__intro">
      <span class="brand-mark" aria-hidden="true">M</span>
      <p class="eyebrow">木鱼图床</p>
      <h1 id="auth-title">图床管理</h1>
      <p class="auth-panel__copy">{{ endpoint }}</p>
    </div>

    <div class="auth-panel__switch" role="tablist" aria-label="登录方式">
      <button :class="{ active: mode === 'token' }" type="button" @click="mode = 'token'">
        <Icon name="lock" :size="14" />
        令牌
      </button>
      <button :class="{ active: mode === 'invite' }" type="button" @click="mode = 'invite'">
        <Icon name="userPlus" :size="14" />
        邀请
      </button>
    </div>

    <form v-if="mode === 'token'" class="auth-panel__form" @submit.prevent="emit('login')">
      <label>
        访问令牌
        <input v-model="tokenDraft" autocomplete="off" placeholder="muyu_xxx" type="password" />
      </label>
      <button class="primary-action" :disabled="busy || !tokenDraft.trim()" type="submit">
        <Icon v-if="busy" name="spinner" :size="14" spin />
        {{ busy ? "验证中..." : "登录" }}
      </button>
    </form>

    <form v-else class="auth-panel__form" @submit.prevent="emit('register')">
      <label>
        显示名称
        <input v-model="registerForm.displayName" autocomplete="name" placeholder="woodfish" />
      </label>
      <label>
        邮箱
        <input v-model="registerForm.email" autocomplete="email" placeholder="选填" type="email" />
      </label>
      <label>
        邀请码
        <input v-model="registerForm.inviteCode" autocomplete="off" placeholder="invite_xxx" />
      </label>
      <button class="primary-action" :disabled="busy || !registerForm.displayName.trim() || !registerForm.inviteCode.trim()" type="submit">
        <Icon v-if="busy" name="spinner" :size="14" spin />
        {{ busy ? "创建中..." : "创建账号" }}
      </button>
    </form>

    <p v-if="error" class="form-error">
      <Icon name="errorCircle" :size="16" />
      {{ error }}
    </p>
    <p class="auth-panel__footnote">
      <Icon name="lock" :size="12" />
      令牌仅保存在当前浏览器中
    </p>
  </section>
</template>

<style scoped>
.auth-panel {
  width: min(400px, calc(100vw - 32px));
  display: grid;
  gap: 28px;
  padding: 48px 40px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.auth-panel__intro {
  display: grid;
  gap: 10px;
  place-items: center;
  text-align: center;
}

.brand-mark {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--ink);
  color: #fff;
  font-size: 20px;
  font-weight: 300;
  margin-bottom: 4px;
}

.eyebrow {
  margin: 0;
  color: var(--muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.auth-panel h1 {
  margin: 0;
  color: var(--ink);
  font-size: clamp(28px, 5vw, 38px);
  font-weight: 300;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.auth-panel__copy {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  font-weight: 300;
  overflow-wrap: anywhere;
}

.auth-panel__switch {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-muted);
}

.auth-panel__switch button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
  transition: all 120ms ease;
}

.auth-panel__switch button.active {
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
}

.auth-panel__form {
  display: grid;
  gap: 16px;
}

.auth-panel__form label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.primary-action {
  justify-self: stretch;
  min-height: 44px;
  font-size: 14px;
}

.form-error {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--danger-bg);
  color: var(--danger);
  font-size: 13px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.auth-panel__footnote {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 300;
}
</style>
