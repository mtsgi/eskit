import ESKitManifest from "./manifest.js";

/**
 * ESKitRegistry — アプリレジストリ
 *
 * アプリディレクトリから define.json を読み込み、Manifest を管理する。
 * id → { manifest, dir } の Map で保持し、dir でも逆引き可能。
 */
export default class ESKitRegistry {
  #manifests = new Map(); // id → { manifest, dir }
  #byDir     = new Map(); // normalizedDir → id

  /**
   * アプリディレクトリから define.json を読み込んで登録する。
   * @param {string} appDir  例: "apps/myapp/"
   * @returns {Promise<Manifest>}
   */
  async register(appDir) {
    const dir = this.#normalizeDir(appDir);
    const manifest = await ESKitManifest.load(dir);
    this.#manifests.set(manifest.id, { manifest, dir });
    this.#byDir.set(dir, manifest.id);
    return manifest;
  }

  /**
   * Manifest を手動で登録する (外部アプリインストール等に利用)。
   * @param {string} id
   * @param {Manifest} manifest
   * @param {string|null} [dir]
   */
  registerManual(id, manifest, dir = null) {
    const normalDir = dir ? this.#normalizeDir(dir) : null;
    this.#manifests.set(id, { manifest, dir: normalDir });
    if (normalDir) this.#byDir.set(normalDir, id);
  }

  /**
   * 登録を解除する。
   * @param {string} id
   */
  unregister(id) {
    const entry = this.#manifests.get(id);
    if (entry?.dir) this.#byDir.delete(entry.dir);
    this.#manifests.delete(id);
  }

  /**
   * ID で Manifest を取得する。
   * @param {string} id
   * @returns {Manifest|null}
   */
  get(id) {
    return this.#manifests.get(id)?.manifest ?? null;
  }

  /**
   * ディレクトリパスで Manifest を取得する。
   * @param {string} appDir
   * @returns {Manifest|null}
   */
  getByDir(appDir) {
    const dir = this.#normalizeDir(appDir);
    const id  = this.#byDir.get(dir);
    return id ? (this.#manifests.get(id)?.manifest ?? null) : null;
  }

  /**
   * 登録されているすべての Manifest を返す。
   * 各オブジェクトには便宜的に `_dir` プロパティ (登録ディレクトリ) を付与する。
   * @returns {(Manifest & { _dir: string|null })[]}
   */
  list() {
    return [...this.#manifests.values()].map(({ manifest, dir }) => ({
      ...manifest,
      _dir: dir,
    }));
  }

  /**
   * 名前・説明でアプリを検索する。
   * @param {string} query
   * @returns {Manifest[]}
   */
  search(query) {
    const q = query.toLowerCase();
    return this.list().filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q),
    );
  }

  /**
   * 外部 URL からアプリをインストールする。(Phase 5 で実装)
   * @param {string} _url  HTTPS URL (例: "https://example.com/myapp/")
   * @returns {Promise<Manifest>}
   */
  async registerFromUrl(_url) {
    throw new Error("[ESKitRegistry] registerFromUrl is not yet implemented (Phase 5)");
  }

  #normalizeDir(dir) {
    return dir.endsWith("/") ? dir : dir + "/";
  }
}
