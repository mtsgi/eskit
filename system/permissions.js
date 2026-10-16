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
   * @param {string} uuid
   * @param {string} permission
   * @param {boolean} [granted=true]
   */
  grant(uuid, permission, granted = true) {
    this.#decisions.set(`${uuid}:${permission}`, granted);
    const manifest = this.#appManifests.get(uuid);
    if (manifest) {
      const stored = this.#loadStored(manifest.id);
      stored[permission] = granted;
      localStorage.setItem(this.#storageKey(manifest.id), JSON.stringify(stored));
    }
  }

  /**
   * 権限を拒否に設定し localStorage に永続化する。
   * @param {string} uuid
   * @param {string} permission
   */
  deny(uuid, permission) {
    this.grant(uuid, permission, false);
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

  // ─── 内部ヘルパー ──────────────────────────────────────────────────────────

  #loadStored(appId) {
    try {
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
