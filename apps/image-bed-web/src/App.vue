<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import type {
  CreateInviteResponse,
  CreateTokenResponse,
  ImageRecord,
  InviteRecord,
  ListImagesResponse,
  ListInvitesResponse,
  ListTokensResponse,
  ListUsersResponse,
  MeResponse,
  TokenScope,
  UserRecord,
} from "@woodfish-nest/shared";

type TabId = "upload" | "images" | "tokens" | "invites" | "users";

interface UploadItem {
  name: string;
  file?: File;
  status: "pending" | "uploading" | "done" | "failed";
  url?: string;
  markdown?: string;
  originalUrl?: string;
  error?: string;
}

const STORAGE_KEY = "muyu.admin.token";

const endpoint = window.location.origin;
const activeTab = ref<TabId>("upload");
const token = ref("");
const tokenDraft = ref("");
const me = ref<MeResponse | null>(null);
const globalError = ref("");
const busy = ref(false);
const dragActive = ref(false);
const uploadInput = ref<HTMLInputElement | null>(null);

const uploadQueue = ref<UploadItem[]>([]);
const images = ref<ImageRecord[]>([]);
const imageNextCursor = ref<string | null>(null);
const imageLoading = ref(false);

const tokens = ref<
  Array<{
    id: string;
    name: string;
    scopes: TokenScope[];
    createdAt: string;
    revokedAt: string | null;
    lastUsedAt: string | null;
    expiresAt: string | null;
  }>
>([]);
const tokenForm = reactive({
  name: "",
  scopes: new Set<TokenScope>(["upload", "images:read", "images:delete"]),
});
const lastRawToken = ref("");

const invites = ref<InviteRecord[]>([]);
const inviteMaxUses = ref(1);
const inviteExpiresAt = ref("");
const lastInviteCode = ref("");

const users = ref<UserRecord[]>([]);
const deleteTarget = ref<ImageRecord | null>(null);
const deleteError = ref("");
const deletingImageIds = ref<Set<string>>(new Set());

const isAuthed = computed(() => token.value.length > 0 && !!me.value);
const isAdmin = computed(() => me.value?.role === "admin");

const tabList = computed(() => {
  const base: Array<{ id: TabId; label: string }> = [
    { id: "upload", label: "Upload" },
    { id: "images", label: "Images" },
    { id: "tokens", label: "Tokens" },
  ];
  if (isAdmin.value) {
    base.push({ id: "invites", label: "Invites" });
    base.push({ id: "users", label: "Users" });
  }
  return base;
});

const selectableScopes: TokenScope[] = [
  "upload",
  "images:read",
  "images:delete",
  "tokens:manage",
  "invites:manage",
  "admin",
];

const tabPathMap: Record<TabId, string> = {
  images: "#/images",
  invites: "#/invites",
  tokens: "#/tokens",
  upload: "#/upload",
  users: "#/users",
};

function setError(message: string) {
  globalError.value = message;
}

function clearError() {
  globalError.value = "";
}

async function api<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("content-type") && init.body && !(init.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }
  if (token.value) {
    headers.set("authorization", `Bearer ${token.value}`);
  }

  const resp = await fetch(`${endpoint}${path}`, {
    ...init,
    headers,
  });

  const text = await resp.text();
  const json = text.length > 0 ? (JSON.parse(text) as T | { error?: { message?: string } }) : null;
  if (!resp.ok) {
    const message = (json as { error?: { message?: string } } | null)?.error?.message || `HTTP ${resp.status}`;
    throw new Error(message);
  }
  return json as T;
}

async function validateToken() {
  if (!token.value) {
    me.value = null;
    return false;
  }

  try {
    const profile = await api<MeResponse>("/api/me");
    me.value = profile;
    clearError();
    return true;
  } catch (error) {
    me.value = null;
    setError(`Token invalid: ${formatError(error)}`);
    return false;
  }
}

async function saveToken() {
  token.value = tokenDraft.value.trim();
  localStorage.setItem(STORAGE_KEY, token.value);
  await validateToken();
  if (me.value) {
    ensureActiveTabAllowed();
    await refreshCurrentTab();
  }
}

function logout() {
  token.value = "";
  tokenDraft.value = "";
  me.value = null;
  localStorage.removeItem(STORAGE_KEY);
}

async function refreshCurrentTab() {
  if (!me.value) {
    return;
  }
  try {
    if (activeTab.value === "images") {
      await loadImages(true);
    } else if (activeTab.value === "tokens") {
      await loadTokens();
    } else if (activeTab.value === "invites") {
      await loadInvites();
    } else if (activeTab.value === "users") {
      await loadUsers();
    }
  } catch (error) {
    setError(formatError(error));
  }
}

async function onTabChange(next: TabId) {
  activeTab.value = next;
  syncTabHash(next);
  await refreshCurrentTab();
}

function onFileInputChanged() {
  const files = uploadInput.value?.files;
  if (!files || files.length === 0) {
    return;
  }
  void uploadMany(Array.from(files));
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  dragActive.value = true;
}

function onDragLeave() {
  dragActive.value = false;
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  dragActive.value = false;
  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) {
    return;
  }
  void uploadMany(Array.from(files));
}

async function uploadMany(files: File[]) {
  clearError();
  for (const file of files) {
    const item: UploadItem = {
      file,
      name: file.name,
      status: "pending",
    };
    uploadQueue.value.unshift(item);
    await uploadOne(item);
  }

  if (activeTab.value === "images") {
    await loadImages(true);
  }
}

async function uploadOne(item: UploadItem) {
  if (!item.file) {
    item.status = "failed";
    item.error = "missing file";
    return;
  }

  item.status = "uploading";
  item.error = undefined;
  try {
    const body = new FormData();
    body.set("file", item.file);
    body.set("source", "web");
    const result = await api<{
      url: string;
      markdown: string;
      originalUrl: string;
    }>("/api/upload", {
      method: "POST",
      body,
    });
    item.status = "done";
    item.url = result.url;
    item.markdown = result.markdown;
    item.originalUrl = result.originalUrl;
  } catch (error) {
    item.status = "failed";
    item.error = formatError(error);
  }
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

async function retryUpload(item: UploadItem) {
  await uploadOne(item);
}

async function loadImages(reset = false) {
  if (imageLoading.value) {
    return;
  }

  imageLoading.value = true;
  try {
    const cursorPart = !reset && imageNextCursor.value ? `&cursor=${encodeURIComponent(imageNextCursor.value)}` : "";
    const data = await api<ListImagesResponse>(`/api/images?limit=24${cursorPart}`);
    imageNextCursor.value = data.nextCursor;
    images.value = reset ? data.items : images.value.concat(data.items);
  } finally {
    imageLoading.value = false;
  }
}

function openDeleteConfirm(image: ImageRecord) {
  deleteTarget.value = image;
  deleteError.value = "";
}

function closeDeleteConfirm() {
  if (deletingImageIds.value.size > 0) {
    return;
  }
  deleteTarget.value = null;
  deleteError.value = "";
}

async function confirmDeleteImage() {
  const image = deleteTarget.value;
  if (!image) {
    return;
  }
  if (deletingImageIds.value.has(image.id)) {
    return;
  }
  deletingImageIds.value = new Set(deletingImageIds.value).add(image.id);
  deleteError.value = "";
  try {
    await api(`/api/images/${image.id}`, {
      method: "DELETE",
    });
    images.value = images.value.filter((item) => item.id !== image.id);
    deleteTarget.value = null;
  } catch (error) {
    deleteError.value = formatError(error);
  } finally {
    const nextSet = new Set(deletingImageIds.value);
    nextSet.delete(image.id);
    deletingImageIds.value = nextSet;
  }
}

function toggleScope(scope: TokenScope) {
  if (tokenForm.scopes.has(scope)) {
    tokenForm.scopes.delete(scope);
  } else {
    tokenForm.scopes.add(scope);
  }
}

async function loadTokens() {
  const data = await api<ListTokensResponse>("/api/tokens");
  tokens.value = data.items;
}

async function createToken() {
  const name = tokenForm.name.trim();
  const scopes = Array.from(tokenForm.scopes);
  if (!name || scopes.length === 0) {
    setError("Token name and scopes are required.");
    return;
  }

  const data = await api<CreateTokenResponse>("/api/tokens", {
    method: "POST",
    body: JSON.stringify({
      name,
      scopes,
    }),
  });
  lastRawToken.value = data.token;
  tokenForm.name = "";
  await loadTokens();
}

async function revokeToken(id: string) {
  await api(`/api/tokens/${id}/revoke`, { method: "POST" });
  await loadTokens();
}

async function loadInvites() {
  const data = await api<ListInvitesResponse>("/api/invites");
  invites.value = data.items;
}

async function createInvite() {
  const payload: { maxUses: number; expiresAt?: string } = { maxUses: Number(inviteMaxUses.value) };
  if (inviteExpiresAt.value.trim()) {
    payload.expiresAt = new Date(inviteExpiresAt.value).toISOString();
  }
  const data = await api<CreateInviteResponse>("/api/invites", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  lastInviteCode.value = data.inviteCode;
  await loadInvites();
}

async function disableInvite(id: string) {
  await api(`/api/invites/${id}/disable`, { method: "POST" });
  await loadInvites();
}

async function loadUsers() {
  const data = await api<ListUsersResponse>("/api/users");
  users.value = data.items;
}

async function disableUser(id: string) {
  const confirmed = window.confirm(`Disable user ${id}?`);
  if (!confirmed) {
    return;
  }
  await api(`/api/users/${id}/disable`, {
    method: "POST",
  });
  await loadUsers();
}

function openUrl(url: string | undefined) {
  if (!url) {
    return;
  }
  window.open(url, "_blank", "noopener");
}

function getImageDisplayUrl(image: ImageRecord) {
  return image.variants.find((v) => v.kind === image.defaultVariant)?.publicUrl || image.variants[0]?.publicUrl || "";
}

function getImageThumbUrl(image: ImageRecord) {
  return image.variants.find((v) => v.kind === "thumb")?.publicUrl || getImageDisplayUrl(image);
}

function getImageMarkdown(image: ImageRecord) {
  return `![${image.displayName}](${getImageDisplayUrl(image)})`;
}

function resolveTabFromHash() {
  const normalized = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  if (normalized === "images") return "images";
  if (normalized === "tokens") return "tokens";
  if (normalized === "invites") return "invites";
  if (normalized === "users") return "users";
  return "upload";
}

function syncTabHash(tab: TabId) {
  const target = tabPathMap[tab];
  if (window.location.hash !== target) {
    window.history.replaceState(null, "", target);
  }
}

function ensureActiveTabAllowed() {
  if (tabList.value.some((entry) => entry.id === activeTab.value)) {
    return;
  }
  activeTab.value = "upload";
  syncTabHash(activeTab.value);
}

async function onHashChange() {
  const tab = resolveTabFromHash();
  if (!tabList.value.some((entry) => entry.id === tab)) {
    syncTabHash(activeTab.value);
    return;
  }
  if (activeTab.value !== tab) {
    activeTab.value = tab;
    await refreshCurrentTab();
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

onMounted(async () => {
  window.addEventListener("hashchange", onHashChange);
  tokenDraft.value = localStorage.getItem(STORAGE_KEY) || "";
  token.value = tokenDraft.value;
  activeTab.value = resolveTabFromHash();
  ensureActiveTabAllowed();
  syncTabHash(activeTab.value);
  if (token.value) {
    busy.value = true;
    try {
      await validateToken();
      ensureActiveTabAllowed();
      await refreshCurrentTab();
    } finally {
      busy.value = false;
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("hashchange", onHashChange);
});
</script>

<template>
  <main class="shell">
    <header class="top">
      <h1>Muyu Admin</h1>
      <p>{{ endpoint }}</p>
    </header>

    <section class="auth-card" v-if="!isAuthed">
      <label>
        Token
        <input v-model="tokenDraft" type="password" placeholder="muyu_xxx" />
      </label>
      <button :disabled="busy || !tokenDraft.trim()" @click="saveToken">Login</button>
      <p class="hint">Token is stored in localStorage on this browser.</p>
      <p class="error" v-if="globalError">{{ globalError }}</p>
    </section>

    <template v-else>
      <section class="session">
        <div>
          <strong>{{ me?.displayName }}</strong>
          <span class="muted">({{ me?.role }})</span>
        </div>
        <div class="session-actions">
          <button @click="refreshCurrentTab">Refresh</button>
          <button @click="logout">Logout</button>
        </div>
      </section>

      <nav class="tabs">
        <button
          v-for="tab in tabList"
          :key="tab.id"
          :class="{ active: activeTab === tab.id }"
          @click="onTabChange(tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <p class="error" v-if="globalError">{{ globalError }}</p>

      <section v-if="activeTab === 'upload'" class="card">
        <h2>Upload</h2>
        <div
          class="dropzone"
          :class="{ drag: dragActive }"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <p>Drop files here or pick files</p>
          <input ref="uploadInput" type="file" multiple @change="onFileInputChanged" />
        </div>
        <ul class="upload-list">
          <li v-for="item in uploadQueue" :key="`${item.name}-${item.url || item.error || item.status}`">
            <span>{{ item.name }}</span>
            <span>{{ item.status }}</span>
            <button v-if="item.url" title="Copy URL" @click="copyText(item.url)">Copy URL</button>
            <button v-if="item.markdown" title="Copy Markdown" @click="copyText(item.markdown)">Copy Markdown</button>
            <button v-if="item.originalUrl" title="Copy original URL" @click="copyText(item.originalUrl)">Copy Original</button>
            <button v-if="item.status === 'failed'" title="Retry upload" @click="retryUpload(item)">Retry</button>
            <span class="error" v-if="item.error">{{ item.error }}</span>
          </li>
        </ul>
      </section>

      <section v-if="activeTab === 'images'" class="card">
        <h2>Images</h2>
        <div class="row">
          <button @click="loadImages(true)">Reload</button>
          <button :disabled="!imageNextCursor || imageLoading" @click="loadImages(false)">Load More</button>
        </div>
        <p v-if="imageLoading">Loading...</p>
        <p v-else-if="images.length === 0">No images.</p>
        <ul class="image-grid" v-else>
          <li v-for="image in images" :key="image.id">
            <img class="thumb" :src="getImageThumbUrl(image)" :alt="image.displayName" />
            <div class="name">{{ image.displayName }}</div>
            <div class="muted">created: {{ formatDate(image.createdAt) }}</div>
            <div class="muted">size: {{ image.sizeBytes }} bytes · source: {{ image.source }}</div>
            <div class="buttons">
              <button title="Copy display URL" @click="copyText(getImageDisplayUrl(image))">
                Copy URL
              </button>
              <button title="Copy markdown snippet" @click="copyText(getImageMarkdown(image))">
                Copy Markdown
              </button>
              <button title="Open in new tab" @click="openUrl(image.variants[0]?.publicUrl)">Open</button>
              <button
                :disabled="deletingImageIds.has(image.id)"
                title="Delete image"
                @click="openDeleteConfirm(image)"
              >
                {{ deletingImageIds.has(image.id) ? "Deleting..." : "Delete" }}
              </button>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="activeTab === 'tokens'" class="card">
        <h2>Tokens</h2>
        <div class="token-form">
          <label>
            Name
            <input v-model="tokenForm.name" placeholder="typora-upload" />
          </label>
          <div class="scope-list">
            <label v-for="scope in selectableScopes" :key="scope">
              <input type="checkbox" :checked="tokenForm.scopes.has(scope)" @change="toggleScope(scope)" />
              {{ scope }}
            </label>
          </div>
          <button @click="createToken">Create Token</button>
          <p class="hint" v-if="lastRawToken">
            New token (show once): <code>{{ lastRawToken }}</code>
            <button title="Copy token" @click="copyText(lastRawToken)">Copy</button>
          </p>
        </div>
        <ul class="simple-list">
          <li v-for="entry in tokens" :key="entry.id">
            <span>{{ entry.name }}</span>
            <span class="muted">{{ entry.scopes.join(", ") }}</span>
            <span class="muted">last used: {{ formatDate(entry.lastUsedAt) }}</span>
            <span class="muted">expires: {{ formatDate(entry.expiresAt) }}</span>
            <button :disabled="!!entry.revokedAt" @click="revokeToken(entry.id)">
              {{ entry.revokedAt ? "Revoked" : "Revoke" }}
            </button>
          </li>
        </ul>
      </section>

      <section v-if="activeTab === 'invites'" class="card">
        <h2>Invites</h2>
        <div class="row">
          <label>
            Max Uses
            <input v-model.number="inviteMaxUses" type="number" min="1" />
          </label>
          <label>
            Expires At
            <input v-model="inviteExpiresAt" type="datetime-local" />
          </label>
          <button @click="createInvite">Create Invite</button>
        </div>
        <p class="hint" v-if="lastInviteCode">
          Invite code (show once): <code>{{ lastInviteCode }}</code>
          <button title="Copy invite code" @click="copyText(lastInviteCode)">Copy</button>
        </p>
        <ul class="simple-list">
          <li v-for="invite in invites" :key="invite.id">
            <span>{{ invite.id }}</span>
            <span class="muted">uses {{ invite.usedCount }}/{{ invite.maxUses }}</span>
            <span class="muted">expires {{ formatDate(invite.expiresAt) }}</span>
            <button :disabled="!!invite.disabledAt" @click="disableInvite(invite.id)">
              {{ invite.disabledAt ? "Disabled" : "Disable" }}
            </button>
          </li>
        </ul>
      </section>

      <section v-if="activeTab === 'users'" class="card">
        <h2>Users</h2>
        <ul class="simple-list">
          <li v-for="entry in users" :key="entry.id">
            <span>{{ entry.displayName }} ({{ entry.role }})</span>
            <span class="muted">{{ entry.tokenCount }} tokens · {{ entry.imageCount }} images</span>
            <span class="muted">created {{ formatDate(entry.createdAt) }}</span>
            <button :disabled="!!entry.disabledAt || entry.role === 'admin'" @click="disableUser(entry.id)">
              {{ entry.disabledAt ? "Disabled" : "Disable" }}
            </button>
          </li>
        </ul>
      </section>

      <section v-if="deleteTarget" class="modal-backdrop" @click.self="closeDeleteConfirm">
        <div class="modal">
          <h3>Delete image</h3>
          <p class="muted">This only marks the image as deleted in MVP.</p>
          <img class="thumb" :src="getImageThumbUrl(deleteTarget)" :alt="deleteTarget.displayName" />
          <p class="name">{{ deleteTarget.displayName }}</p>
          <p class="error" v-if="deleteError">{{ deleteError }}</p>
          <div class="row">
            <button :disabled="deletingImageIds.has(deleteTarget.id)" @click="confirmDeleteImage">
              {{ deletingImageIds.has(deleteTarget.id) ? "Deleting..." : "Confirm Delete" }}
            </button>
            <button :disabled="deletingImageIds.has(deleteTarget.id)" @click="closeDeleteConfirm">
              Cancel
            </button>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.shell {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}

.top h1 {
  margin: 0;
  font-size: 28px;
}

.top p {
  margin-top: 6px;
  color: #374151;
}

.card,
.auth-card,
.session {
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  padding: 16px;
  margin-top: 14px;
}

.session {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-actions {
  display: flex;
  gap: 8px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.tabs button.active {
  background: #111827;
  color: white;
}

.error {
  color: #b91c1c;
}

.hint {
  color: #1f2937;
  font-size: 13px;
}

.dropzone {
  border: 2px dashed #9ca3af;
  border-radius: 10px;
  padding: 18px;
  background: #f9fafb;
}

.dropzone.drag {
  border-color: #111827;
  background: #eef2ff;
}

.dropzone input {
  margin-top: 8px;
}

.upload-list,
.simple-list,
.image-grid {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.upload-list li,
.simple-list li,
.image-grid li {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
  display: grid;
  gap: 6px;
  min-width: 0;
}

.image-grid li .buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.image-grid li .buttons button {
  min-width: 104px;
}

.thumb {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.token-form {
  display: grid;
  gap: 8px;
}

.scope-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.muted {
  color: #4b5563;
  font-size: 13px;
}

.name {
  font-weight: 600;
  word-break: break-word;
  overflow-wrap: anywhere;
}

button {
  border: 1px solid #111827;
  background: #ffffff;
  border-radius: 8px;
  padding: 6px 12px;
  min-height: 34px;
  cursor: pointer;
}

button:focus-visible,
input:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 6px 10px;
}

.muted,
.hint,
.error {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal {
  width: min(520px, 100%);
  border-radius: 12px;
  border: 1px solid #d1d5db;
  background: #fff;
  padding: 16px;
  display: grid;
  gap: 10px;
}

@media (max-width: 760px) {
  .shell {
    padding: 14px;
  }
}
</style>
