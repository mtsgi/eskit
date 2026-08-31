/**
 * ESKitPermissions — 2 段階権限マネージャー
 *
 * Install-time: define.json の permissions[] でアプリが事前宣言する
 * Runtime:      System API 呼び出し時に check() でユーザー確認を行う
 *
 * Runtime チェックフロー:
 *   1. isDeclared → false → 即拒否
 *   2. localStorage に許可記録あり → 即許可 / 即拒否
 *   3. 記録なし → eskit-permission-dialog (Web Component) でユーザー確認 → localStorage に記録
 */
import ESKitPermissionDialogElement from "./elements/permission-dialog/main.js";

// Custom Element を登録 (未登録の場合のみ)
if (!customElements.get("eskit-permission-dialog")) {
  customElements.define("eskit-permission-dialog", ESKitPermissionDialogElement);
}

export default class ESKitPermissions {
  #appManifests = new Map(); // uuid → Manifest
  #decisions    = new Map(); // `${uuid}:${perm}` → boolean

  /**
   * アプリを登録し、localStorage から過去の許可決定を復元する。
   * ESKitSystem.loadApp() から呼ばれる。
   * @param {string} uuid
   * @param {Manifest} manifest
   */
  registerApp(uuid, manifest) {
    this.#appManifests.set(uuid, manifest);

    const stored = this.#loadStored(manifest.id);
    for (const [perm, granted] of Object.entries(stored)) {
      this.#decisions.set(`${uuid}:${perm}`, granted);
    }
  }

  /**
   * Install-time チェック: マニフェストに権限が宣言されているか (同期)。
   * @param {string} uuid
   * @param {string} permission
   * @returns {boolean}
   */
  isDeclared(uuid, permission) {
    return this.#appManifests.get(uuid)?.permissions?.includes(permission) ?? false;
  }

  /**
   * Runtime チェック: 実際の許可状態を確認する (非同期、必要に応じてダイアログ表示)。
   * @param {string} uuid
   * @param {string} permission
   * @returns {Promise<boolean>}
   */
  async check(uuid, permission) {
    if (!this.isDeclared(uuid, permission)) {
      console.warn(`[ESKitPermissions] Permission "${permission}" not declared by app ${uuid}`);
      return false;
    }

    const key = `${uuid}:${permission}`;
    if (this.#decisions.has(key)) {
      return this.#decisions.get(key);
    }

    const granted = await this.#requestPermission(uuid, permission);
    this.grant(uuid, permission, granted);
    return granted;
  }

  /**
   * 権限を許可 / 拒否に設定し localStorage に永続化する。
   * @param {string} uuidOrAppId アプリ UUID または App ID (例: "eskit.settings")
   * @param {string} permission 権限コード
   * @param {boolean} [granted=true]
   */
  grant(uuidOrAppId, permission, granted = true) {
    let appId = uuidOrAppId;

    if (this.#appManifests.has(uuidOrAppId)) {
      const m = this.#appManifests.get(uuidOrAppId);
      appId = m?.id || uuidOrAppId;
      this.#decisions.set(`${uuidOrAppId}:${permission}`, granted);
    } else {
      // appId で全一致する実行中インスタンスの decision を更新
      for (const [uuid, m] of this.#appManifests) {
        if (m.id === uuidOrAppId || uuid === uuidOrAppId) {
          this.#decisions.set(`${uuid}:${permission}`, granted);
        }
      }
    }

    try {
      const stored = this.#loadStored(appId);
      stored[permission] = granted;
      localStorage.setItem(this.#storageKey(appId), JSON.stringify(stored));
    } catch (e) {
      console.warn("[ESKitPermissions] Failed to persist permission to localStorage", e);
    }

    window.System?.events?.emit("permissions:changed", { appId, permission, state: granted ? "granted" : "denied" });
  }

  /**
   * 権限を拒否に設定し localStorage に永続化する。
   * @param {string} uuidOrAppId
   * @param {string} permission
   */
  deny(uuidOrAppId, permission) {
    this.grant(uuidOrAppId, permission, false);
  }

  /**
   * 特定の権限個別を取り消す (localStorage およびセッション内 decisions から削除)。
   * 次回アプリがその権限を要求した際に再度確認ダイアログが表示される。
   * @param {string} uuidOrAppId アプリ UUID または App ID
   * @param {string} permission 権限コード
   */
  revokePermission(uuidOrAppId, permission) {
    let appId = uuidOrAppId;

    // 該当するセッション decisions を削除
    for (const [key] of [...this.#decisions.entries()]) {
      const [uuid, perm] = key.split(":");
      if (perm === permission) {
        const manifest = this.#appManifests.get(uuid);
        if (uuid === uuidOrAppId || manifest?.id === uuidOrAppId) {
          this.#decisions.delete(key);
          if (manifest?.id) appId = manifest.id;
        }
      }
    }

    if (this.#appManifests.has(uuidOrAppId)) {
      appId = this.#appManifests.get(uuidOrAppId)?.id || appId;
    }

    try {
      const stored = this.#loadStored(appId);
      if (permission in stored) {
        delete stored[permission];
        localStorage.setItem(this.#storageKey(appId), JSON.stringify(stored));
      }
    } catch (e) {
      console.warn("[ESKitPermissions] Failed to remove permission from localStorage", e);
    }

    window.System?.events?.emit("permissions:changed", { appId, permission, state: "unprompted" });
  }

  /**
   * アプリのすべての実行時権限を取り消す。
   * @param {string} uuidOrAppId
   */
  revokeAll(uuidOrAppId) {
    let appId = uuidOrAppId;

    for (const [key] of [...this.#decisions.entries()]) {
      const [uuid] = key.split(":");
      const manifest = this.#appManifests.get(uuid);
      if (uuid === uuidOrAppId || manifest?.id === uuidOrAppId) {
        this.#decisions.delete(key);
        if (manifest?.id) appId = manifest.id;
      }
    }

    if (this.#appManifests.has(uuidOrAppId)) {
      appId = this.#appManifests.get(uuidOrAppId)?.id || appId;
    }

    try {
      localStorage.removeItem(this.#storageKey(appId));
    } catch (e) {
      console.warn("[ESKitPermissions] Failed to clear permissions from localStorage", e);
    }

    window.System?.events?.emit("permissions:changed", { appId, state: "unprompted" });
  }

  /**
   * アプリ終了時にセッション権限エントリをクリアする (localStorage は維持)。
   * @param {string} uuid
   */
  revoke(uuid) {
    for (const key of [...this.#decisions.keys()]) {
      if (key.startsWith(`${uuid}:`)) this.#decisions.delete(key);
    }
    this.#appManifests.delete(uuid);
  }

  /**
   * 権限の現在の決定状態を取得する。
   * @param {string} uuidOrAppId
   * @param {string} permission
   * @returns {"granted" | "denied" | "unprompted"}
   */
  getPermissionState(uuidOrAppId, permission) {
    let appId = uuidOrAppId;
    if (this.#appManifests.has(uuidOrAppId)) {
      appId = this.#appManifests.get(uuidOrAppId)?.id || uuidOrAppId;
    }

    // まずセッション内 decisions を確認
    if (this.#decisions.has(`${uuidOrAppId}:${permission}`)) {
      return this.#decisions.get(`${uuidOrAppId}:${permission}`) ? "granted" : "denied";
    }

    // 次に localStorage を確認
    try {
      const stored = this.#loadStored(appId);
      if (stored[permission] === true) return "granted";
      if (stored[permission] === false) return "denied";
    } catch {
      // ignore
    }

    return "unprompted";
  }

  /**
   * アプリに保存されている全権限決定を取得する。
   * @param {string} appId
   * @returns {Record<string, boolean>}
   */
  getStoredDecisions(appId) {
    return this.#loadStored(appId);
  }

  // ─── 内部ヘルパー ──────────────────────────────────────────────────────────

  #loadStored(appId) {
    try {
      const user = window.System?.currentUser;
      if (!user) return {};
      return JSON.parse(localStorage.getItem(this.#storageKey(appId)) ?? "{}");
    } catch {
      return {};
    }
  }

  #storageKey(appId) {
    const user = window.System?.currentUser;
    if (!user) {
      throw new Error(`[ESKitPermissions] Cannot resolve storage key without an active user session`);
    }
    return `eskit-perm-${user.id}-${appId}`;
  }

  /**
   * eskit-permission-dialog Web Component を使ってユーザーに権限確認を行う。
   * ダイアログは document.body に遅延シングルトンとして追加される。
   * @param {string} uuid
   * @param {string} permission
   * @returns {Promise<boolean>}
   */
  #requestPermission(uuid, permission) {
    const manifest = this.#appManifests.get(uuid);
    const appName  = manifest?.name ?? uuid;

    // シングルトンダイアログの遅延生成
    if (!ESKitPermissions.#dialogElement) {
      const el = document.createElement("eskit-permission-dialog");
      document.body.appendChild(el);
      ESKitPermissions.#dialogElement = el;
    }

    return ESKitPermissions.#dialogElement.request(appName, permission);
  }

  /** シングルトンのダイアログ要素 */
  static #dialogElement = null;
}
