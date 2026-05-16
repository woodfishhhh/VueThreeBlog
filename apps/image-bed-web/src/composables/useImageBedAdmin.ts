import { computed, onBeforeUnmount, onMounted, reactive, shallowRef } from "vue";
import type {
  AuditLogRecord,
  CreateInviteResponse,
  CreateTokenResponse,
  ImageRecord,
  InviteRecord,
  ListAuditLogsResponse,
  ListImagesResponse,
  ListInvitesResponse,
  ListTokensResponse,
  ListUsersResponse,
  MeResponse,
  RegisterResponse,
  TokenRecord,
  TokenScope,
  UploadImageResponse,
  UserRecord,
} from "@woodfish-nest/shared";
import { formatError } from "../utils/imageBed";

export type TabId = "upload" | "images" | "tokens" | "invites" | "users" | "audit";

export interface UploadItem {
  id: string;
  name: string;
  sizeBytes: number;
  file?: File;
  status: "pending" | "uploading" | "done" | "failed";
  url?: string;
  markdown?: string;
  originalUrl?: string;
  thumbnailUrl?: string | null;
  error?: string;
}

export interface TabEntry {
  id: TabId;
  label: string;
}

interface ApiErrorBody {
  error?: {
    message?: string;
  };
}

const STORAGE_KEY = "muyu.admin.token";

const tabPathMap: Record<TabId, string> = {
  audit: "#/audit",
  images: "#/images",
  invites: "#/invites",
  tokens: "#/tokens",
  upload: "#/upload",
  users: "#/users",
};

const selectableScopes: TokenScope[] = [
  "upload",
  "images:read",
  "images:delete",
  "tokens:manage",
  "invites:manage",
  "admin",
];

export function useImageBedAdmin() {
  const configuredEndpoint = (import.meta.env.VITE_IMAGE_BED_API_BASE as string | undefined)?.replace(/\/$/, "");
  const endpoint = configuredEndpoint || window.location.origin;

  const activeTab = shallowRef<TabId>("upload");
  const token = shallowRef("");
  const tokenDraft = shallowRef("");
  const me = shallowRef<MeResponse | null>(null);
  const globalError = shallowRef("");
  const busy = shallowRef(false);
  const notice = shallowRef("");

  const registerForm = reactive({
    displayName: "",
    email: "",
    inviteCode: "",
  });

  const uploadQueue = shallowRef<UploadItem[]>([]);
  const images = shallowRef<ImageRecord[]>([]);
  const imageNextCursor = shallowRef<string | null>(null);
  const imageLoading = shallowRef(false);

  const tokens = shallowRef<TokenRecord[]>([]);
  const tokenForm = reactive({
    name: "",
    expiresAt: "",
    scopes: new Set<TokenScope>(["upload", "images:read", "images:delete"]),
  });
  const lastRawToken = shallowRef("");

  const invites = shallowRef<InviteRecord[]>([]);
  const inviteMaxUses = shallowRef(1);
  const inviteExpiresAt = shallowRef("");
  const lastInviteCode = shallowRef("");

  const users = shallowRef<UserRecord[]>([]);
  const auditLogs = shallowRef<AuditLogRecord[]>([]);
  const auditNextCursor = shallowRef<string | null>(null);
  const auditLoading = shallowRef(false);

  const deleteTarget = shallowRef<ImageRecord | null>(null);
  const deleteError = shallowRef("");
  const deletingImageIds = shallowRef<Set<string>>(new Set());

  const isAuthed = computed(() => token.value.length > 0 && !!me.value);
  const isAdmin = computed(() => me.value?.role === "admin");

  const tabList = computed<TabEntry[]>(() => {
    const base: TabEntry[] = [
      { id: "upload", label: "上传" },
      { id: "images", label: "图片" },
      { id: "tokens", label: "令牌" },
    ];

    if (isAdmin.value) {
      base.push({ id: "invites", label: "邀请" });
      base.push({ id: "users", label: "用户" });
      base.push({ id: "audit", label: "审计" });
    }

    return base;
  });

  const uploadStats = computed(() => {
    const done = uploadQueue.value.filter((item) => item.status === "done").length;
    const failed = uploadQueue.value.filter((item) => item.status === "failed").length;
    const uploading = uploadQueue.value.filter((item) => item.status === "uploading").length;
    return { done, failed, uploading, total: uploadQueue.value.length };
  });

  const imageStats = computed(() => {
    const totalBytes = images.value.reduce((sum, image) => sum + image.sizeBytes, 0);
    return {
      count: images.value.length,
      totalBytes,
    };
  });

  async function api<T>(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {});
    if (!headers.has("content-type") && init.body && !(init.body instanceof FormData)) {
      headers.set("content-type", "application/json");
    }
    if (token.value) {
      headers.set("authorization", `Bearer ${token.value}`);
    }

    const response = await fetch(`${endpoint}${path}`, {
      ...init,
      headers,
    });

    const text = await response.text();
    const json = text.length > 0 ? (JSON.parse(text) as T | ApiErrorBody) : null;
    if (!response.ok) {
      const message = (json as ApiErrorBody | null)?.error?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }

    return json as T;
  }

  function setError(message: string) {
    globalError.value = message;
  }

  function clearError() {
    globalError.value = "";
  }

  function flash(message: string) {
    notice.value = message;
    window.setTimeout(() => {
      if (notice.value === message) {
        notice.value = "";
      }
    }, 2200);
  }

  async function validateToken() {
    if (!token.value) {
      me.value = null;
      return false;
    }

    try {
      me.value = await api<MeResponse>("/api/me");
      clearError();
      return true;
    } catch (error) {
      me.value = null;
      setError(`令牌无效: ${formatError(error)}`);
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

  async function registerWithInvite() {
    const displayName = registerForm.displayName.trim();
    const inviteCode = registerForm.inviteCode.trim();
    const email = registerForm.email.trim();
    if (!displayName || !inviteCode) {
      setError("显示名称和邀请码为必填项。");
      return;
    }

    busy.value = true;
    try {
      const data = await api<RegisterResponse>("/api/register", {
        body: JSON.stringify({
          displayName,
          email: email || null,
          inviteCode,
        }),
        method: "POST",
      });
      token.value = data.token;
      tokenDraft.value = data.token;
      me.value = data.user;
      localStorage.setItem(STORAGE_KEY, data.token);
      registerForm.displayName = "";
      registerForm.email = "";
      registerForm.inviteCode = "";
      clearError();
      flash("注册并登录成功。");
      await refreshCurrentTab();
    } catch (error) {
      setError(formatError(error));
    } finally {
      busy.value = false;
    }
  }

  function logout() {
    token.value = "";
    tokenDraft.value = "";
    me.value = null;
    uploadQueue.value = [];
    images.value = [];
    tokens.value = [];
    invites.value = [];
    users.value = [];
    auditLogs.value = [];
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
      } else if (activeTab.value === "audit") {
        await loadAuditLogs(true);
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

  async function uploadMany(files: File[]) {
    clearError();
    for (const file of files) {
      const item: UploadItem = {
        file,
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        name: file.name,
        sizeBytes: file.size,
        status: "pending",
      };
      uploadQueue.value = [item, ...uploadQueue.value];
      await uploadOne(item);
    }

    if (activeTab.value === "images") {
      await loadImages(true);
    }
  }

  async function uploadOne(item: UploadItem) {
    if (!item.file) {
      item.status = "failed";
      item.error = "文件缺失。";
      uploadQueue.value = [...uploadQueue.value];
      return;
    }

    item.status = "uploading";
    item.error = undefined;
    uploadQueue.value = [...uploadQueue.value];
    try {
      const body = new FormData();
      body.set("file", item.file);
      body.set("source", "web");
      const result = await api<UploadImageResponse>("/api/upload", {
        body,
        method: "POST",
      });
      item.status = "done";
      item.url = result.url;
      item.markdown = result.markdown;
      item.originalUrl = result.originalUrl;
      item.thumbnailUrl = result.thumbnailUrl;
      flash("上传完成。");
    } catch (error) {
      item.status = "failed";
      item.error = formatError(error);
    } finally {
      uploadQueue.value = [...uploadQueue.value];
    }
  }

  async function retryUpload(item: UploadItem) {
    await uploadOne(item);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    flash("已复制。");
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
      images.value = reset ? data.items : [...images.value, ...data.items];
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
    if (!image || deletingImageIds.value.has(image.id)) {
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
      flash("图片已删除。");
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
      setError("令牌名称和权限范围为必填项。");
      return;
    }

    const data = await api<CreateTokenResponse>("/api/tokens", {
      body: JSON.stringify({
        expiresAt: tokenForm.expiresAt ? new Date(tokenForm.expiresAt).toISOString() : null,
        name,
        scopes,
      }),
      method: "POST",
    });
    lastRawToken.value = data.token;
    tokenForm.name = "";
    tokenForm.expiresAt = "";
    flash("令牌已创建。");
    await loadTokens();
  }

  async function revokeToken(id: string) {
    await api(`/api/tokens/${id}/revoke`, { method: "POST" });
    flash("令牌已撤销。");
    await loadTokens();
  }

  async function loadInvites() {
    const data = await api<ListInvitesResponse>("/api/invites");
    invites.value = data.items;
  }

  async function createInvite() {
    const maxUses = Number(inviteMaxUses.value);
    if (!Number.isFinite(maxUses) || maxUses < 1) {
      setError("邀请码最大使用次数至少为 1。");
      return;
    }

    const data = await api<CreateInviteResponse>("/api/invites", {
      body: JSON.stringify({
        expiresAt: inviteExpiresAt.value ? new Date(inviteExpiresAt.value).toISOString() : null,
        maxUses,
      }),
      method: "POST",
    });
    lastInviteCode.value = data.inviteCode;
    flash("邀请已创建。");
    await loadInvites();
  }

  async function disableInvite(id: string) {
    await api(`/api/invites/${id}/disable`, { method: "POST" });
    flash("邀请已禁用。");
    await loadInvites();
  }

  async function loadUsers() {
    const data = await api<ListUsersResponse>("/api/users");
    users.value = data.items;
  }

  async function disableUser(id: string) {
    const confirmed = window.confirm(`禁用用户 ${id}?`);
    if (!confirmed) {
      return;
    }

    await api(`/api/users/${id}/disable`, { method: "POST" });
    flash("用户已禁用。");
    await loadUsers();
  }

  async function loadAuditLogs(reset = false) {
    if (auditLoading.value) {
      return;
    }

    auditLoading.value = true;
    try {
      const cursorPart = !reset && auditNextCursor.value ? `&cursor=${encodeURIComponent(auditNextCursor.value)}` : "";
      const data = await api<ListAuditLogsResponse>(`/api/audit-logs?limit=30${cursorPart}`);
      auditNextCursor.value = data.nextCursor;
      auditLogs.value = reset ? data.items : [...auditLogs.value, ...data.items];
    } finally {
      auditLoading.value = false;
    }
  }

  function resolveTabFromHash() {
    const normalized = window.location.hash.replace(/^#\/?/, "").toLowerCase();
    if (normalized === "images") return "images";
    if (normalized === "tokens") return "tokens";
    if (normalized === "invites") return "invites";
    if (normalized === "users") return "users";
    if (normalized === "audit") return "audit";
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

  function openUrl(url: string | undefined) {
    if (!url) {
      return;
    }
    window.open(url, "_blank", "noopener");
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

  return {
    activeTab,
    auditLoading,
    auditLogs,
    auditNextCursor,
    busy,
    clearError,
    closeDeleteConfirm,
    confirmDeleteImage,
    copyText,
    createInvite,
    createToken,
    deleteError,
    deleteTarget,
    deletingImageIds,
    disableInvite,
    disableUser,
    endpoint,
    globalError,
    imageLoading,
    imageNextCursor,
    imageStats,
    images,
    inviteExpiresAt,
    inviteMaxUses,
    invites,
    isAdmin,
    isAuthed,
    lastInviteCode,
    lastRawToken,
    loadAuditLogs,
    loadImages,
    logout,
    me,
    notice,
    onTabChange,
    openDeleteConfirm,
    openUrl,
    refreshCurrentTab,
    registerForm,
    registerWithInvite,
    revokeToken,
    retryUpload,
    saveToken,
    selectableScopes,
    tabList,
    tokenDraft,
    tokenForm,
    tokens,
    toggleScope,
    uploadMany,
    uploadQueue,
    uploadStats,
    users,
  };
}
