/**
 * ESKitFileSystem — IndexedDB ベースの仮想ファイルシステム
 *
 * データベース: "eskit-fs" (バージョン 1)
 * オブジェクトストア: "files"
 *   keyPath: "path"
 *   インデックス: "parent" (ディレクトリ一覧用)
 *
 * エントリ形式:
 *   { path, parent, type: "file"|"dir", content: Uint8Array|null, createdAt, modifiedAt }
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
    const parent = this.#parentOf(normalPath);

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
   * @returns {Promise<{path, type, size, createdAt, modifiedAt}>}
   */
  async stat(path) {
    const normalPath = this.#normalize(path);
    const entry = await this.#get(normalPath);
    if (!entry) throw new Error(`ENOENT: no such file or directory: ${normalPath}`);
    return {
      path:       entry.path,
      type:       entry.type,
      size:       entry.content?.byteLength ?? 0,
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
    const entry = await this.#get(from);
    if (!entry) throw new Error(`ENOENT: no such file or directory: ${from}`);

    const newParent = this.#parentOf(to);
    if (!await this.exists(newParent)) {
      await this.mkdir(newParent, { recursive: true });
    }

    const tx = this.#db.transaction(ESKitFileSystem.#STORE, "readwrite");
    const store = tx.objectStore(ESKitFileSystem.#STORE);
    await this.#promisify(store.delete(from));
    await this.#promisify(store.put({ ...entry, path: to, parent: newParent, modifiedAt: Date.now() }));
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
      createdAt: now,
      modifiedAt: now,
    });
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
