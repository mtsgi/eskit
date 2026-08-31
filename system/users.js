const USERS_STORAGE_KEY = "eskit-users-v1";
const SESSION_STORAGE_KEY = "eskit-session-user-v1";
const USER_ID_PATTERN = /^[a-z][a-z0-9_-]{0,30}$/;
const PASSWORD_MIN_LEN = 4;
const PBKDF2_ITERATIONS = 210_000;

/**
 * ESKitUsers — ユーザー管理 / セッション管理
 *
 * 認証情報はローカルに保持される (開発用途)。
 * password は PBKDF2(SHA-256) で hash 化して保存し、平文では保存しない。
 */
export default class ESKitUsers {
  #users = [];
  #currentUserId = null;

  async init() {
    this.#users = this.#loadUsers();
    this.#currentUserId = localStorage.getItem(SESSION_STORAGE_KEY);

    if (this.#currentUserId) {
      const current = this.#users.find((u) => u.id === this.#currentUserId && !u.disabled);
      if (!current) this.logout();
    }
  }

  hasUsers() {
    return this.#users.some((u) => !u.disabled);
  }

  list() {
    return this.#users
      .filter((u) => !u.disabled)
      .map((u) => this.#publicUser(u));
  }

  get(userId) {
    const user = this.#users.find((u) => u.id === userId && !u.disabled);
    return user ? this.#publicUser(user) : null;
  }

  getCurrent() {
    if (!this.#currentUserId) return null;
    return this.get(this.#currentUserId);
  }

  async create({ id, name, password, isAdmin = false }) {
    const userId = this.#normalizeUserId(id);
    const displayName = String(name ?? "").trim() || userId;

    if (!USER_ID_PATTERN.test(userId)) {
      const msg = window.System?.i18n?.t("login.errInvalidUserId") || "ユーザー ID は英小文字で始まり、英小文字・数字・_・- の 1〜31 文字で入力してください";
      throw new Error(msg);
    }
    if (this.#users.some((u) => u.id === userId && !u.disabled)) {
      const msg = window.System?.i18n?.t("login.errUserExists", { userId }) || `ユーザー "${userId}" は既に存在します`;
      throw new Error(msg);
    }
    if (isAdmin && this.hasUsers()) {
      const current = this.getCurrent();
      if (!current?.isAdmin) {
        const msg = window.System?.i18n?.t("login.errAdminOnly") || "管理者ユーザーを作成できるのは管理者のみです";
        throw new Error(msg);
      }
    }
    this.#validatePassword(password);

    const { hash, salt } = await this.#hashPassword(String(password));
    const user = {
      id: userId,
      name: displayName,
      isAdmin: Boolean(isAdmin),
      passwordHash: hash,
      salt,
      createdAt: Date.now(),
      disabled: false,
    };

    this.#users.push(user);
    this.#saveUsers();
    return this.#publicUser(user);
  }

  async login(id, password) {
    const userId = this.#normalizeUserId(id);
    const user = this.#users.find((u) => u.id === userId && !u.disabled);
    if (!user) {
      const msg = window.System?.i18n?.t("login.errUserNotFound") || "ユーザーが存在しません";
      throw new Error(msg);
    }

    const ok = await this.#verifyPassword(String(password), user.salt, user.passwordHash);
    if (!ok) {
      const msg = window.System?.i18n?.t("login.errInvalidPass") || "パスワードが正しくありません";
      throw new Error(msg);
    }

    this.#currentUserId = user.id;
    localStorage.setItem(SESSION_STORAGE_KEY, user.id);
    return this.#publicUser(user);
  }

  logout() {
    this.#currentUserId = null;
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  async delete(userId) {
    const current = this.getCurrent();
    if (!current?.isAdmin) {
      const msg = window.System?.i18n?.t("login.errDeleteAdminOnly") || "ユーザーを削除できるのは管理者のみです";
      throw new Error(msg);
    }

    const id = this.#normalizeUserId(userId);
    const idx = this.#users.findIndex((u) => u.id === id && !u.disabled);
    if (idx < 0) {
      const msg = window.System?.i18n?.t("login.errUserNotFound") || "削除対象のユーザーが見つかりません";
      throw new Error(msg);
    }

    const target = this.#users[idx];
    if (target.isAdmin) {
      const activeAdmins = this.#users.filter((u) => !u.disabled && u.isAdmin);
      if (activeAdmins.length <= 1) {
        const msg = window.System?.i18n?.t("login.errLastAdmin") || "最後の管理者ユーザーは削除できません";
        throw new Error(msg);
      }
    }

    this.#users[idx] = { ...target, disabled: true };
    if (this.#currentUserId === id) {
      this.logout();
    }
    this.#saveUsers();
  }

  // ─── 内部ヘルパー ──────────────────────────────────────────────────────────

  #normalizeUserId(input) {
    return String(input ?? "").trim().toLowerCase();
  }

  #validatePassword(password) {
    const len = String(password ?? "").length;
    if (len > 0 && len < PASSWORD_MIN_LEN) {
      const msg = window.System?.i18n?.t("login.errPasswordTooShort", { minLen: PASSWORD_MIN_LEN }) || `パスワードは空欄にするか、${PASSWORD_MIN_LEN} 文字以上で入力してください`;
      throw new Error(msg);
    }
  }

  #publicUser(user) {
    return {
      id: user.id,
      name: user.name,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    };
  }

  #loadUsers() {
    try {
      const parsed = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) ?? "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((u) => u && typeof u.id === "string");
    } catch {
      return [];
    }
  }

  #saveUsers() {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.#users));
  }

  async #hashPassword(password) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = ESKitUsers.#bytesToBase64(saltBytes);
    const hash = await this.#deriveHash(password, salt);
    return { hash, salt };
  }

  async #verifyPassword(password, salt, expectedHash) {
    const hash = await this.#deriveHash(password, salt);
    return hash === expectedHash;
  }

  async #deriveHash(password, saltBase64) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: ESKitUsers.#base64ToBytes(saltBase64),
        iterations: PBKDF2_ITERATIONS,
      },
      keyMaterial,
      256,
    );

    return ESKitUsers.#bytesToBase64(new Uint8Array(bits));
  }

  static #bytesToBase64(bytes) {
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }

  static #base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
