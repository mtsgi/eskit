import { signal } from "./hamon.js";

/**
 * ESKitI18n — 多言語対応 (i18n) サービス
 *
 * Hamon の Signal を活用したリアクティブな言語切替を提供。
 * テンプレート内で `System.i18n.t("key")` を参照することで、
 * 言語変更時に UI が自動・最小限に再描画される。
 */
export default class ESKitI18n {
  /** @type {import('./hamon.js').Signal<string>} */
  locale = signal("ja");
  #revision = signal(0);
  #dictionaries = new Map(); // lang -> dict object
  #available = ["ja", "en"];
  #appDictionaries = new Map(); // appId -> { appDir, i18nPath, shortId }

  constructor() {
    // 初期の言語自動検出 (navigator.language)
    const browserLang = navigator.language?.toLowerCase() || "en";
    const initialLang = browserLang.startsWith("ja") ? "ja" : "en";
    this.locale.value = initialLang;
  }

  get current() {
    return this.locale.value;
  }

  get available() {
    return [...this.#available];
  }

  // ─── 初期化と永続化 ────────────────────────────────────────────────────────

  /**
   * 辞書ロードと VFS 設定の読み込み
   */
  async init() {
    await Promise.all([
      this.load("ja"),
      this.load("en"),
    ]);

    const user = window.System?.currentUser;
    if (user && window.System?.fs) {
      try {
        const configPath = `/home/${user.id}/.config/i18n.json`;
        if (await window.System.fs.exists(configPath)) {
          const content = await window.System.fs.readFile(configPath);
          const data = JSON.parse(content);
          if (data.locale && this.#available.includes(data.locale)) {
            this.locale.value = data.locale;
          }
        }
      } catch (e) {
        console.warn("[ESKitI18n] Failed to load i18n config from VFS:", e);
      }
    }

    this.#revision.value++;
    this.#emitChange();
  }

  /**
   * 言語設定を VFS へ保存
   */
  async save() {
    const user = window.System?.currentUser;
    if (!user || !window.System?.fs) return;

    try {
      const configPath = `/home/${user.id}/.config/i18n.json`;
      const data = {
        locale: this.locale.value,
        updatedAt: Date.now(),
      };
      await window.System.fs.writeFile(configPath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn("[ESKitI18n] Failed to save i18n config to VFS:", e);
    }
  }

  // ─── 辞書操作 & 翻訳 ───────────────────────────────────────────────────────

  /**
   * 辞書 JSON を読み込む
   * @param {string} lang
   */
  async load(lang) {
    if (this.#dictionaries.has(lang)) return;

    try {
      const url = new URL(`./i18n/${lang}.json`, import.meta.url);
      const res = await fetch(url);
      if (res.ok) {
        const dict = await res.json();
        this.#dictionaries.set(lang, dict);
        if (!this.#available.includes(lang)) {
          this.#available.push(lang);
        }
        this.#revision.value++;
      } else {
        console.warn(`[ESKitI18n] Could not load dictionary for "${lang}": ${res.status}`);
      }
    } catch (e) {
      console.warn(`[ESKitI18n] Error loading dictionary for "${lang}":`, e);
    }
  }

  /**
   * 言語を変更する
   * @param {string} lang
   */
  async setLocale(lang) {
    if (!this.#available.includes(lang)) {
      await this.load(lang);
    }
    this.locale.value = lang;

    // 登録中アプリの対象言語辞書をロード
    await Promise.allSettled(
      [...this.#appDictionaries.values()].map(async ({ appDir, i18nPath, shortId }) => {
        try {
          const dir = appDir.endsWith("/") ? appDir : appDir + "/";
          let rel = (i18nPath || "./i18n/").replace(/^\.\//, "");
          if (!rel.endsWith("/")) rel += "/";
          const url = new URL(`${dir}${rel}${lang}.json`, window.location.href);
          const res = await fetch(url);
          if (res.ok) {
            const dict = await res.json();
            this.extend(shortId, lang, dict);
          }
        } catch {
          // ignore missing dictionary
        }
      })
    );

    this.#revision.value++;
    this.#emitChange();
    await this.save();
  }

  /**
   * アプリ固有の言語辞書を読み込む
   * @param {string} appDir 例: "apps/notepad/"
   * @param {string} appId 例: "eskit.notepad"
   * @param {string} [i18nPath="./i18n/"]
   */
  async loadAppDictionary(appDir, appId, i18nPath = "./i18n/") {
    if (!appDir || !appId) return;
    const shortId = appId.replace(/^eskit\./, "").replace(/^apps\//, "").replace(/\/$/, "");
    this.#appDictionaries.set(appId, { appDir, i18nPath, shortId });

    const dir = appDir.endsWith("/") ? appDir : appDir + "/";
    let rel = (i18nPath || "./i18n/").replace(/^\.\//, "");
    if (!rel.endsWith("/")) rel += "/";

    const currentLang = this.locale.value;
    const langsToLoad = [currentLang];
    if (currentLang !== "en") langsToLoad.push("en");
    if (currentLang !== "ja" && !langsToLoad.includes("ja")) langsToLoad.push("ja");

    await Promise.allSettled(
      langsToLoad.map(async (lang) => {
        try {
          const url = new URL(`${dir}${rel}${lang}.json`, window.location.href);
          const res = await fetch(url);
          if (res.ok) {
            const dict = await res.json();
            this.extend(shortId, lang, dict);
          }
        } catch {
          // ignore missing app dictionary
        }
      })
    );
  }

  /**
   * キーから翻訳テキストを取得する (Hamon リアクティブ対応)
   * @param {string} key ドット区切りのキーパス (例: "settings.tabs.appearance")
   * @param {Record<string, string|number>} [vars] テンプレート変数
   * @returns {string}
   */
  t(key, vars = {}) {
    // 依存追跡のために locale.value と #revision.value を参照する
    const currentLang = this.locale.value;
    void this.#revision.value;

    const dict = this.#dictionaries.get(currentLang);
    let val = this.#getNested(dict, key);

    // フォールバック: 英語
    if (val === undefined && currentLang !== "en") {
      const enDict = this.#dictionaries.get("en");
      val = this.#getNested(enDict, key);
    }

    // 英語でも見つからない場合、日本語辞書 (ベース言語) をフォールバック
    if (val === undefined && currentLang !== "ja") {
      const jaDict = this.#dictionaries.get("ja");
      val = this.#getNested(jaDict, key);
    }

    // 見つからない場合はキー名を返す
    if (val === undefined || typeof val !== "string") {
      return key;
    }

    // 変数置換 {varName}
    if (vars && typeof vars === "object") {
      return val.replace(/\{(\w+)\}/g, (match, p1) => {
        return vars[p1] !== undefined ? String(vars[p1]) : match;
      });
    }

    return val;
  }

  /**
   * アプリ固有の辞書を拡張する
   * @param {string} appId
   * @param {string} lang
   * @param {Record<string, any>} dict
   */
  extend(appId, lang, dict) {
    if (!this.#dictionaries.has(lang)) {
      this.#dictionaries.set(lang, {});
    }
    const target = this.#dictionaries.get(lang);
    target[appId] = { ...(target[appId] || {}), ...dict };
    // locale が対象言語であればシグナル更新をトリガー
    if (this.locale.value === lang) {
      this.#revision.value++;
    }
  }

  // ─── フォーマット & アプリ名解決ヘルパー ──────────────────────────────────────

  /**
   * 現在のロケールに応じた時刻文字列 (例: "14:30" / "2:30 PM") を返す
   * @param {Date|number} dateOrTimestamp
   * @param {Intl.DateTimeFormatOptions} [options]
   * @returns {string}
   */
  formatTime(dateOrTimestamp = Date.now(), options = { hour: "2-digit", minute: "2-digit" }) {
    const loc = this.locale.value === "ja" ? "ja-JP" : "en-US";
    const d = typeof dateOrTimestamp === "number" ? new Date(dateOrTimestamp) : dateOrTimestamp;
    return new Intl.DateTimeFormat(loc, options).format(d);
  }

  /**
   * 現在のロケールに応じた日付文字列 (例: "2026/8/28" / "8/28/2026") を返す
   * @param {Date|number} dateOrTimestamp
   * @param {Intl.DateTimeFormatOptions} [options]
   * @returns {string}
   */
  formatDate(dateOrTimestamp = Date.now(), options = { year: "numeric", month: "numeric", day: "numeric", weekday: "short" }) {
    const loc = this.locale.value === "ja" ? "ja-JP" : "en-US";
    const d = typeof dateOrTimestamp === "number" ? new Date(dateOrTimestamp) : dateOrTimestamp;
    return new Intl.DateTimeFormat(loc, options).format(d);
  }

  /**
   * マニフェストから多言語化されたアプリ名を取得する
   * @param {{ id: string, name: string|Record<string, string> }} manifest
   * @param {string} [lang=this.locale.value] 対象ロケール (省略時は現在ロケール)
   * @returns {string}
   */
  getAppName(manifest, lang = this.locale.value) {
    if (!manifest) return "";
    const id = manifest.id || "";
    const shortId = id.replace(/^eskit\./, "").replace(/^apps\//, "").replace(/\/$/, "");
    const currentLang = lang || this.locale.value;

    // 1. manifest.name が多言語オブジェクトの場合
    if (typeof manifest.name === "object" && manifest.name !== null) {
      if (manifest.name[currentLang]) return manifest.name[currentLang];
      if (manifest.name.en) return manifest.name.en;
      const first = Object.values(manifest.name)[0];
      if (first) return String(first);
    }

    // 2. 辞書 (apps.{shortId}.name) から取得
    const dictKey = `apps.${shortId}.name`;
    const dict = this.#dictionaries.get(currentLang);
    const val = this.#getNested(dict, dictKey);
    if (val && typeof val === "string") return val;

    // 3. フォールバック: t()
    const translated = this.t(dictKey);
    if (translated !== dictKey) return translated;

    // 4. 文字列フォールバック
    return typeof manifest.name === "string" ? manifest.name : id;
  }

  /**
   * マニフェストから多言語化されたアプリ説明文を取得する
   * @param {{ id: string, description?: string|Record<string, string> }} manifest
   * @param {string} [lang=this.locale.value] 対象ロケール (省略時は現在ロケール)
   * @returns {string}
   */
  getAppDescription(manifest, lang = this.locale.value) {
    if (!manifest) return "";
    const id = manifest.id || "";
    const shortId = id.replace(/^eskit\./, "").replace(/^apps\//, "").replace(/\/$/, "");
    const currentLang = lang || this.locale.value;

    // 1. manifest.description が多言語オブジェクトの場合
    if (typeof manifest.description === "object" && manifest.description !== null) {
      if (manifest.description[currentLang]) return manifest.description[currentLang];
      if (manifest.description.en) return manifest.description.en;
      const first = Object.values(manifest.description)[0];
      if (first) return String(first);
    }

    // 2. 辞書 (apps.{shortId}.description) から取得
    const dictKey = `apps.${shortId}.description`;
    const dict = this.#dictionaries.get(currentLang);
    const val = this.#getNested(dict, dictKey);
    if (val && typeof val === "string") return val;

    // 3. フォールバック: t()
    const translated = this.t(dictKey);
    if (translated !== dictKey) return translated;

    // 4. 文字列フォールバック
    return typeof manifest.description === "string" ? manifest.description : "";
  }

  /**
   * 権限コード（例: "fs.read"）から多言語化された説明文を取得する
   * @param {string} permCode
   * @returns {string}
   */
  getPermissionDescription(permCode) {
    if (!permCode) return "";
    const key = `permissions.descriptions.${permCode.replace(/\./g, "_")}`;
    const desc = this.t(key);
    return desc !== key ? desc : permCode;
  }

  // ─── 内部ヘルパー ──────────────────────────────────────────────────────────

  #getNested(obj, path) {
    if (!obj || typeof obj !== "object") return undefined;
    const parts = path.split(".");
    let curr = obj;
    for (const part of parts) {
      if (curr == null || typeof curr !== "object") return undefined;
      curr = curr[part];
    }
    return curr;
  }

  #emitChange() {
    window.System?.events?.emit("system:locale-changed", { lang: this.locale.value });
  }
}
