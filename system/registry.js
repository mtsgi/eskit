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
    if (!query) return this.list();
    const q = query.toLowerCase();
    const i18n = window.System?.i18n;

    return this.list().filter((m) => {
      // 1. ID で検索
      if (m.id && m.id.toLowerCase().includes(q)) return true;

      // 2. 現在のロケールでの解決名・説明文で検索
      if (i18n) {
        const appName = i18n.getAppName(m);
        if (appName && appName.toLowerCase().includes(q)) return true;
        const appDesc = i18n.getAppDescription(m);
        if (appDesc && appDesc.toLowerCase().includes(q)) return true;
      }

      // 3. 多言語オブジェクト内の全言語で検索
      const names = typeof m.name === "object" && m.name ? Object.values(m.name) : [m.name];
      for (const n of names) {
        if (typeof n === "string" && n.toLowerCase().includes(q)) return true;
      }

      const descs = typeof m.description === "object" && m.description ? Object.values(m.description) : [m.description];
      for (const d of descs) {
        if (typeof d === "string" && d.toLowerCase().includes(q)) return true;
      }

      return false;
    });
  }

  /**
   * 拡張子に関連付けられたアプリマニフェストを検索する。
   * @param {string} ext  例: ".txt", "md"
   * @returns {(Manifest & { _dir: string|null }) | null}
   */
  findAppByExtension(ext) {
    if (!ext) return null;
    const normalized = ext.startsWith(".") ? ext.toLowerCase() : "." + ext.toLowerCase();
    for (const app of this.list()) {
      if (Array.isArray(app.fileAssociations) && app.fileAssociations.includes(normalized)) {
        return app;
      }
    }
    return null;
  }

  /**
   * 外部 URL からアプリをインストールする。
   * @param {string} url  HTTPS URL または同一オリジン URL (例: "https://example.com/myapp/")
   * @returns {Promise<Manifest>}
   */
  async registerFromUrl(url) {
    if (!url || typeof url !== "string") {
      throw new Error("Invalid URL for app installation");
    }

    const trimmed = url.trim();
    if (!trimmed.startsWith("https://") && !trimmed.startsWith("./") && !trimmed.startsWith("/") && !trimmed.startsWith("http://localhost")) {
      throw new Error("Only HTTPS URLs or local paths are allowed for external app installation.");
    }

    const dir = this.#normalizeDir(trimmed);
    const manifestUrl = dir + "define.json";

    const res = await fetch(manifestUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch define.json from ${dir} (HTTP ${res.status})`);
    }

    const json = await res.json();
    const manifest = ESKitManifest.validate(json, dir);

    // ユーザー確認ダイアログ
    const dialog = window.System?.dialog;
    if (dialog) {
      const i18n = window.System?.i18n;
      const appName = i18n?.getAppName(manifest) || (typeof manifest.name === "string" ? manifest.name : manifest.id);
      const appDesc = i18n?.getAppDescription(manifest) || (typeof manifest.description === "string" ? manifest.description : "");
      const permsList = (manifest.permissions || [])
        .map((p) => `• ${p} (${i18n?.getPermissionDescription(p) || p})`)
        .join("\n");
      const reqPermsLabel = i18n?.t("registry.requiredPerms") || "要求される権限:";
      const noPermsLabel = i18n?.t("registry.noPerms") || "なし";
      const permMsg = permsList ? `\n\n${reqPermsLabel}\n${permsList}` : `\n\n${reqPermsLabel} ${noPermsLabel}`;
      const descLine = appDesc ? `\n${appDesc}` : "";
      const promptSuffix = i18n?.t("registry.installPrompt") || "このアプリをインストールしますか？";
      const message = `${appName} (v${manifest.version || "0.0.1"})\nID: ${manifest.id}${descLine}${permMsg}\n\n${promptSuffix}`;

      const approved = await dialog.confirm({
        title: i18n?.t("registry.installConfirmTitle") || "外部アプリのインストール",
        message,
        okText: i18n?.t("registry.install") || "インストール",
        cancelText: i18n?.t("dialog.cancel") || "キャンセル",
        icon: "download",
      });

      if (!approved) {
        throw new Error(i18n?.t("registry.installCancelled") || "App installation cancelled by user");
      }
    }

    // レジストリに登録
    this.registerManual(manifest.id, manifest, dir);

    // VFS 永続化
    await this.#persistInstalledApp(manifest.id, manifest, dir);

    window.System?.events?.emit("registry:installed", { id: manifest.id, manifest, dir });

    return manifest;
  }

  /**
   * インストール済み外部アプリをアンインストール（登録解除および VFS から削除）する。
   * @param {string} id
   */
  async uninstall(id) {
    const entry = this.#manifests.get(id);
    if (!entry) return;

    this.unregister(id);
    await this.#removePersistedApp(id);

    window.System?.events?.emit("registry:uninstalled", { id });
  }

  /**
   * VFS に保存されているインストール済み外部アプリを復元ロードする。
   */
  async loadInstalledApps() {
    const system = window.System;
    if (!system?.fs) return;

    // 1. システム全体 (/system/installed-apps.json)
    try {
      if (await system.fs.exists("/system/installed-apps.json")) {
        const content = await system.fs.readFile("/system/installed-apps.json");
        const list = JSON.parse(content);
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item?.id && item?.manifest && item?.dir) {
              this.registerManual(item.id, item.manifest, item.dir);
            }
          }
        }
      }
    } catch (e) {
      console.warn("[ESKitRegistry] Failed to load system installed apps:", e);
    }

    // 2. ユーザー個別 (/home/{userId}/.config/installed-apps.json)
    const user = system.currentUser;
    if (user) {
      try {
        const userPath = `/home/${user.id}/.config/installed-apps.json`;
        if (await system.fs.exists(userPath)) {
          const content = await system.fs.readFile(userPath);
          const list = JSON.parse(content);
          if (Array.isArray(list)) {
            for (const item of list) {
              if (item?.id && item?.manifest && item?.dir) {
                this.registerManual(item.id, item.manifest, item.dir);
              }
            }
          }
        }
      } catch (e) {
        console.warn("[ESKitRegistry] Failed to load user installed apps:", e);
      }
    }
  }

  async #persistInstalledApp(id, manifest, dir) {
    const system = window.System;
    if (!system?.fs) return;

    const user = system.currentUser;
    const isAdmin = user?.isAdmin ?? false;
    const configPath = isAdmin
      ? "/system/installed-apps.json"
      : (user ? `/home/${user.id}/.config/installed-apps.json` : null);

    if (!configPath) return;

    try {
      let list = [];
      if (await system.fs.exists(configPath)) {
        const content = await system.fs.readFile(configPath);
        list = JSON.parse(content);
        if (!Array.isArray(list)) list = [];
      }
      list = list.filter((item) => item.id !== id);
      list.push({ id, manifest, dir, installedAt: Date.now() });
      await system.fs.writeFile(configPath, JSON.stringify(list, null, 2));
    } catch (e) {
      console.warn("[ESKitRegistry] Failed to persist installed app to VFS:", e);
    }
  }

  async #removePersistedApp(id) {
    const system = window.System;
    if (!system?.fs) return;

    const paths = ["/system/installed-apps.json"];
    const user = system.currentUser;
    if (user) paths.push(`/home/${user.id}/.config/installed-apps.json`);

    for (const configPath of paths) {
      try {
        if (await system.fs.exists(configPath)) {
          const content = await system.fs.readFile(configPath);
          let list = JSON.parse(content);
          if (Array.isArray(list)) {
            list = list.filter((item) => item.id !== id);
            await system.fs.writeFile(configPath, JSON.stringify(list, null, 2));
          }
        }
      } catch (e) {
        console.warn(`[ESKitRegistry] Failed to remove app ${id} from ${configPath}:`, e);
      }
    }
  }

  #normalizeDir(dir) {
    return dir.endsWith("/") ? dir : dir + "/";
  }
}
