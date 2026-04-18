/**
 * ESKitFileSystem — IndexedDB ベースの仮想ファイルシステム
 *
 * データベース: "eskit-fs" (バージョン 1)
 * オブジェクトストア: "files"
 *   keyPath: "path"
 *   インデックス: "parent" (ディレクトリ一覧用)
 *
 * エントリ形式:
 *   {
 *     path,
 *     parent,
 *     type: "file"|"dir",
 *     content: Uint8Array|null,
 *     owner: string,
 *     mode: {
 *       owner:  { read: boolean, write: boolean },
 *       others: { read: boolean, write: boolean },
 *     },
 *     createdAt,
 *     modifiedAt,
 *   }
 *
 * content は常に Uint8Array として保存される。
 * - テキスト: TextEncoder で encode / TextDecoder で decode
 * - バイナリ: そのまま / Uint8Array を返す
 * - Blob / ArrayBuffer / ArrayBufferView も writeFile に渡せる
 */
export default class ESKitFileSystem {
  static #DB_NAME    = "eskit-fs";
  static #DB_VERSION = 1;          // 開発中につきバージョン固定、破壊的変更を許可
  static #STORE      = "files";
  static #MODE_FILE_DEFAULT = Object.freeze({
    owner:  Object.freeze({ read: true, write: true }),
    others: Object.freeze({ read: false, write: false }),
  });
  static #MODE_DIR_DEFAULT  = Object.freeze({
    owner:  Object.freeze({ read: true, write: true }),
    others: Object.freeze({ read: true, write: false }),
  });
  static #MODE_HOME_DIR_DEFAULT = Object.freeze({
    owner:  Object.freeze({ read: true, write: true }),
    others: Object.freeze({ read: false, write: false }),
  });

  #db = null;

  // ─── 初期化 ────────────────────────────────────────────────────────────────

  /**
   * IndexedDB を開き、スキーマを初期化する。
   * @returns {Promise<this>}
   */
  async init() {
    const req = indexedDB.open(ESKitFileSystem.#DB_NAME, ESKitFileSystem.#DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      // スキーマ変更時は既存ストアを削除して再作成 (開発中・破壊的変更を許可)
      if (db.objectStoreNames.contains(ESKitFileSystem.#STORE)) {
        db.deleteObjectStore(ESKitFileSystem.#STORE);
      }
      const store = db.createObjectStore(ESKitFileSystem.#STORE, { keyPath: "path" });
      store.createIndex("parent", "parent", { unique: false });
    };

    this.#db = await this.#promisify(req);
    return this;
  }

  // ─── パブリック API ────────────────────────────────────────────────────────

  /**
   * ファイルを書き込む。親ディレクトリが存在しない場合は自動作成する。
   *
   * @param {string} path 絶対パス
   * @param {string | ArrayBuffer | ArrayBufferView | Blob} content
   *   - string       → UTF-8 エンコードして保存
   *   - ArrayBuffer  → Uint8Array に変換して保存
   *   - ArrayBufferView (Uint8Array 等) → そのまま保存
   *   - Blob         → arrayBuffer() を経由して保存
   */
  async writeFile(path, content) {
    const normalPath = this.#normalize(path);
    await this.#assertAccess(normalPath, "write");

    const parent = this.#parentOf(normalPath);
    await this.#assertAccess(parent, "write");

    if (!await this.exists(parent)) {
      await this.mkdir(parent, { recursive: true });
    }

    const bytes = await ESKitFileSystem.#toUint8Array(content);
    const now = Date.now();
    const existing = await this.#get(normalPath);
    await this.#put({
      path: normalPath,
      parent,
      type: "file",
      content: bytes,
      owner: existing?.owner ?? this.#ownerForPath(normalPath),
      mode: this.#normalizeMode(existing?.mode, normalPath, "file"),
      createdAt: existing?.createdAt ?? now,
      modifiedAt: now,
    });
  }

  /**
   * ファイルを UTF-8 テキストとして読み込む。
   * @param {string} path 絶対パス
   * @returns {Promise<string>}
   */
  async readFile(path) {
    const bytes = await this.readFileAsBytes(path);
    return new TextDecoder().decode(bytes);
  }

  /**
   * ファイルを生バイト列 (Uint8Array) として読み込む。
   * バイナリファイル (画像・音声・任意データ) に使用する。
   * @param {string} path 絶対パス
   * @returns {Promise<Uint8Array>}
   */
  async readFileAsBytes(path) {
    const normalPath = this.#normalize(path);
    await this.#assertAccess(normalPath, "read");

    const entry = await this.#get(normalPath);
    if (!entry) throw new Error(`ENOENT: no such file: ${normalPath}`);
    if (entry.type !== "file") throw new Error(`EISDIR: is a directory: ${normalPath}`);
    return entry.content ?? new Uint8Array(0);
  }

  /**
   * ディレクトリを作成する。
   * @param {string} path 絶対パス
   * @param {{ recursive?: boolean }} [opts]
   */
  async mkdir(path, { recursive = false } = {}) {
    const normalPath = this.#normalize(path);
    await this.#assertAccess(normalPath, "write");

    if (normalPath === "/") return;

    if (recursive) {
      const parts = normalPath.split("/").filter(Boolean);
      let current = "";
      for (const part of parts) {
        current += "/" + part;
        if (!await this.exists(current)) {
          await this.#mkdirOne(current);
        }
      }
    } else {
      if (await this.exists(normalPath)) return;
      await this.#mkdirOne(normalPath);
    }
  }

  /**
   * ディレクトリの内容を一覧取得する。
   * @param {string} path 絶対パス
   * @returns {Promise<{name: string, type: string, path: string}[]>}
   */
  async readdir(path) {
    const normalPath = this.#normalize(path);
    await this.#assertAccess(normalPath, "read");

    const tx = this.#db.transaction(ESKitFileSystem.#STORE, "readonly");
    const store = tx.objectStore(ESKitFileSystem.#STORE);
    const index = store.index("parent");
    const entries = await this.#promisify(index.getAll(normalPath));
    return entries.map(({ path: p, type }) => ({
      name: p.split("/").at(-1),
      type,
      path: p,
    }));
  }

  /**
   * ファイル / ディレクトリの情報を取得する。
   * @param {string} path 絶対パス
    * @returns {Promise<{path, type, size, owner, mode, createdAt, modifiedAt}>}
   */
  async stat(path) {
    const normalPath = this.#normalize(path);
    await this.#assertAccess(normalPath, "read");

    const entry = await this.#get(normalPath);
    if (!entry) throw new Error(`ENOENT: no such file or directory: ${normalPath}`);
    return {
      path:       entry.path,
      type:       entry.type,
      size:       entry.content?.byteLength ?? 0,
      owner:      entry.owner ?? this.#ownerForPath(entry.path),
      mode:       this.#normalizeMode(entry.mode, entry.path, entry.type),
      createdAt:  entry.createdAt,
      modifiedAt: entry.modifiedAt,
    };
  }

  /**
   * パスが存在するか確認する。
   * @param {string} path 絶対パス
   * @returns {Promise<boolean>}
   */
  async exists(path) {
    const normalPath = this.#normalize(path);
    await this.#assertAccess(normalPath, "read");

    if (normalPath === "/") return true;
    const entry = await this.#get(normalPath);
    return entry !== undefined;
  }

  /**
   * ファイル / ディレクトリを削除する。
   * @param {string} path 絶対パス
   * @param {{ recursive?: boolean }} [opts]
   */
  async remove(path, { recursive = false } = {}) {
    const normalPath = this.#normalize(path);
    await this.#assertAccess(normalPath, "write");

    const entry = await this.#get(normalPath);
    if (!entry) throw new Error(`ENOENT: no such file or directory: ${normalPath}`);

    if (entry.type === "dir" && recursive) {
      const children = await this.readdir(normalPath);
      for (const child of children) {
        await this.remove(child.path, { recursive: true });
      }
    }

    const tx = this.#db.transaction(ESKitFileSystem.#STORE, "readwrite");
    await this.#promisify(tx.objectStore(ESKitFileSystem.#STORE).delete(normalPath));
  }

  /**
   * ファイル / ディレクトリをリネーム / 移動する。
   * @param {string} oldPath
   * @param {string} newPath
   */
  async rename(oldPath, newPath) {
    const from = this.#normalize(oldPath);
    const to   = this.#normalize(newPath);

    await this.#assertAccess(from, "write");
    await this.#assertAccess(to, "write");

    const entry = await this.#get(from);
    if (!entry) throw new Error(`ENOENT: no such file or directory: ${from}`);

    const newParent = this.#parentOf(to);
    if (!await this.exists(newParent)) {
      await this.mkdir(newParent, { recursive: true });
    }

    const tx = this.#db.transaction(ESKitFileSystem.#STORE, "readwrite");
    const store = tx.objectStore(ESKitFileSystem.#STORE);
    await this.#promisify(store.delete(from));
    await this.#promisify(store.put({
      ...entry,
      path: to,
      parent: newParent,
      owner: entry.owner ?? this.#ownerForPath(to),
      mode: this.#normalizeMode(entry.mode, to, entry.type),
      modifiedAt: Date.now(),
    }));
  }

  // ─── 静的ユーティリティ ────────────────────────────────────────────────────

  /**
   * 任意の入力を Uint8Array に変換する。
   * @param {string | ArrayBuffer | ArrayBufferView | Blob} value
   * @returns {Promise<Uint8Array>}
   */
  static async #toUint8Array(value) {
    if (typeof value === "string") {
      return new TextEncoder().encode(value);
    }
    if (value instanceof Blob) {
      return new Uint8Array(await value.arrayBuffer());
    }
    if (value instanceof ArrayBuffer) {
      return new Uint8Array(value);
    }
    if (ArrayBuffer.isView(value)) {
      return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }
    throw new TypeError(`[ESKitFileSystem] writeFile: unsupported content type: ${Object.prototype.toString.call(value)}`);
  }

  // ─── 内部ヘルパー ──────────────────────────────────────────────────────────

  #normalize(path) {
    if (!path.startsWith("/")) throw new Error(`Path must be absolute: "${path}"`);
    const parts = path.split("/").filter((p) => p && p !== ".");
    const result = [];
    for (const part of parts) {
      if (part === "..") result.pop();
      else result.push(part);
    }
    return "/" + result.join("/");
  }

  #parentOf(normalPath) {
    const parts = normalPath.split("/").filter(Boolean);
    parts.pop();
    return "/" + parts.join("/");
  }

  async #mkdirOne(normalPath) {
    const now = Date.now();
    await this.#put({
      path: normalPath,
      parent: this.#parentOf(normalPath),
      type: "dir",
      content: null,
      owner: this.#ownerForPath(normalPath),
      mode: this.#defaultModeFor(normalPath, "dir"),
      createdAt: now,
      modifiedAt: now,
    });
  }

  async #assertAccess(normalPath, action) {
    if (normalPath === "/") return;

    const user = this.#currentUser();
    if (!user) return;
    if (user.isAdmin) return;

    // システム領域は読み取りのみ許可
    if (normalPath.startsWith("/system") || normalPath.startsWith("/apps")) {
      if (action === "read") return;
      throw new Error(`EACCES: ${action} denied: ${normalPath}`);
    }

    // 共有領域は管理者のみ書き込み可
    if (normalPath === "/shared" || normalPath.startsWith("/shared/")) {
      if (action === "read") return;
      throw new Error(`EACCES: ${action} denied: ${normalPath}`);
    }

    // ホーム配下は本人ディレクトリのみ許可
    if (normalPath.startsWith("/home/")) {
      const ownerFromPath = normalPath.split("/").filter(Boolean)[1] ?? null;
      if (ownerFromPath && ownerFromPath !== user.id) {
        throw new Error(`EACCES: ${action} denied: ${normalPath}`);
      }
    }

    const entry = await this.#get(normalPath);
    if (!entry) return;

    const owner = entry.owner ?? this.#ownerForPath(entry.path);
    const mode = this.#normalizeMode(entry.mode, entry.path, entry.type);
    const scope = owner === user.id ? mode.owner : mode.others;
    const allowed = action === "read" ? scope.read : scope.write;

    if (!allowed) {
      throw new Error(`EACCES: ${action} denied by mode ${this.#formatMode(mode)}: ${normalPath}`);
    }
  }

  #ownerForPath(normalPath) {
    const homeOwner = normalPath.startsWith("/home/")
      ? (normalPath.split("/").filter(Boolean)[1] ?? null)
      : null;
    if (homeOwner) return homeOwner;
    return this.#currentUserId() ?? "system";
  }

  #defaultModeFor(normalPath, type) {
    if (type === "dir") {
      if (normalPath.startsWith("/home/")) {
        return this.#cloneMode(ESKitFileSystem.#MODE_HOME_DIR_DEFAULT);
      }
      return this.#cloneMode(ESKitFileSystem.#MODE_DIR_DEFAULT);
    }
    return this.#cloneMode(ESKitFileSystem.#MODE_FILE_DEFAULT);
  }

  #normalizeMode(mode, normalPath, type) {
    if (mode && typeof mode === "object" && mode.owner && mode.others) {
      return this.#cloneMode(mode);
    }
    return this.#defaultModeFor(normalPath, type);
  }

  #cloneMode(mode) {
    return {
      owner: {
        read: Boolean(mode?.owner?.read),
        write: Boolean(mode?.owner?.write),
      },
      others: {
        read: Boolean(mode?.others?.read),
        write: Boolean(mode?.others?.write),
      },
    };
  }

  #formatMode(mode) {
    const fmt = ({ read, write }) => `${read ? "r" : "-"}${write ? "w" : "-"}`;
    return `owner:${fmt(mode.owner)},others:${fmt(mode.others)}`;
  }

  #currentUser() {
    return globalThis.System?.currentUser ?? null;
  }

  #currentUserId() {
    return this.#currentUser()?.id ?? null;
  }

  async #get(path) {
    const tx = this.#db.transaction(ESKitFileSystem.#STORE, "readonly");
    return this.#promisify(tx.objectStore(ESKitFileSystem.#STORE).get(path));
  }

  async #put(entry) {
    const tx = this.#db.transaction(ESKitFileSystem.#STORE, "readwrite");
    return this.#promisify(tx.objectStore(ESKitFileSystem.#STORE).put(entry));
  }

  #promisify(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }
}
