import { THEME_PRESETS, WALLPAPER_PRESETS } from "./themes/presets.js";

/**
 * ESKitTheme — テーマ & 外観管理サービス
 *
 * カラーモード（light / dark / auto）およびテーマプリセット、
 * カスタム変数、壁紙の管理と DOM への即時反映を行う。
 * 設定は VFS（/home/{userId}/.config/theme.json）に永続化される。
 */
export default class ESKitTheme {
  #mode = "auto"; // "light" | "dark" | "auto"
  #themeId = "default-dark";
  #customVars = {};
  #wallpaper = "";
  #importedThemes = new Map(); // id -> ThemeMeta
  #styleEl = null;
  #mediaQuery = null;

  constructor() {
    this.#mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.#mediaQuery.addEventListener("change", () => {
      if (this.#mode === "auto") {
        this.#applyToDOM();
        this.#emitChange();
      }
    });
  }

  // ─── ゲッター ────────────────────────────────────────────────────────────

  get mode() {
    return this.#mode;
  }

  get current() {
    return this.#themeId;
  }

  get wallpaper() {
    return this.#wallpaper || this.getTheme(this.#themeId)?.wallpaper || "";
  }

  get isDark() {
    if (this.#mode === "dark") return true;
    if (this.#mode === "light") return false;
    // auto: テーマ自体の dark フラグ or OS prefers-color-scheme
    const theme = this.getTheme(this.#themeId);
    if (theme && typeof theme.dark === "boolean") {
      return theme.dark;
    }
    return this.#mediaQuery?.matches ?? true;
  }

  get list() {
    const builtin = THEME_PRESETS.map(t => ({ ...t, builtin: true }));
    const imported = [...this.#importedThemes.values()].map(t => ({ ...t, builtin: false }));
    return [...builtin, ...imported];
  }

  get wallpapers() {
    return WALLPAPER_PRESETS;
  }

  get vars() {
    const theme = this.getTheme(this.#themeId);
    return {
      ...(theme?.vars ?? {}),
      ...this.#customVars,
    };
  }

  // ─── 初期化と永続化 ────────────────────────────────────────────────────────

  /**
   * 起動時およびログイン時の初期化
   */
  async init() {
    this.#ensureStyleElement();

    const user = window.System?.currentUser;
    if (user && window.System?.fs) {
      try {
        const configPath = `/home/${user.id}/.config/theme.json`;
        if (await window.System.fs.exists(configPath)) {
          const content = await window.System.fs.readFile(configPath);
          const data = JSON.parse(content);
          if (data.mode) this.#mode = data.mode;
          if (data.themeId) this.#themeId = data.themeId;
          if (data.customVars) this.#customVars = data.customVars;
          if (data.wallpaper) this.#wallpaper = data.wallpaper;
          if (Array.isArray(data.importedThemes)) {
            for (const t of data.importedThemes) {
              if (t && t.id) this.#importedThemes.set(t.id, t);
            }
          }
        }
      } catch (e) {
        console.warn("[ESKitTheme] Failed to load theme config from VFS:", e);
      }
    }

    this.#applyToDOM();
    this.#emitChange();
  }

  /**
   * 設定を VFS へ保存
   */
  async save() {
    const user = window.System?.currentUser;
    if (!user || !window.System?.fs) return;

    try {
      const configPath = `/home/${user.id}/.config/theme.json`;
      const data = {
        mode: this.#mode,
        themeId: this.#themeId,
        customVars: this.#customVars,
        wallpaper: this.#wallpaper,
        importedThemes: [...this.#importedThemes.values()],
        updatedAt: Date.now(),
      };
      await window.System.fs.writeFile(configPath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn("[ESKitTheme] Failed to save theme config to VFS:", e);
    }
  }

  // ─── テーマ操作 API ───────────────────────────────────────────────────────

  /**
   * テーマを取得する
   * @param {string} id
   * @returns {object|null}
   */
  getTheme(id) {
    if (this.#importedThemes.has(id)) {
      return this.#importedThemes.get(id);
    }
    return THEME_PRESETS.find(t => t.id === id) ?? THEME_PRESETS[0];
  }

  /**
   * カラーモード（"light" | "dark" | "auto"）を設定する
   * @param {"light"|"dark"|"auto"} mode
   */
  setMode(mode) {
    if (!["light", "dark", "auto"].includes(mode)) return;
    this.#mode = mode;

    // もし現在のプリセットが明示的な light/dark 専用で、モード変更があった場合に標準プリセットを連動
    if (mode === "dark" && this.#themeId === "default-light") {
      this.#themeId = "default-dark";
    } else if (mode === "light" && this.#themeId === "default-dark") {
      this.#themeId = "default-light";
    }

    this.#applyToDOM();
    this.#emitChange();
    this.save();
  }

  /**
   * プリセットまたはインポート済みテーマを適用する
   * @param {string} id
   */
  apply(id) {
    const theme = this.getTheme(id);
    if (!theme) {
      console.warn(`[ESKitTheme] Theme "${id}" not found.`);
      return;
    }
    this.#themeId = id;
    if (theme.wallpaper && !this.#wallpaper) {
      // テーマ独自の壁紙があれば反映
    }
    this.#applyToDOM();
    this.#emitChange();
    this.save();
  }

  /**
   * カスタム変数を直接適用する
   * @param {Record<string, string>} vars
   * @param {boolean} [dark]
   */
  applyVars(vars, dark) {
    if (vars && typeof vars === "object") {
      this.#customVars = { ...this.#customVars, ...vars };
    }
    if (typeof dark === "boolean") {
      this.#mode = dark ? "dark" : "light";
    }
    this.#applyToDOM();
    this.#emitChange();
    this.save();
  }

  /**
   * 壁紙を設定する
   * @param {string} value CSS background 値 (linear-gradient(...), url(...), #hex)
   */
  setWallpaper(value) {
    this.#wallpaper = value;
    this.#applyToDOM();
    this.#emitChange();
    this.save();
  }

  /**
   * 外部 URL から theme.json を fetch して登録・適用する
   * @param {string} url
   * @returns {Promise<object>}
   */
  async load(url) {
    if (!url || typeof url !== "string") {
      throw new Error("Invalid URL");
    }

    const trimmed = url.trim();
    if (!trimmed.startsWith("https://") && !trimmed.startsWith("./") && !trimmed.startsWith("/")) {
      throw new Error("Only HTTPS URLs or local paths are allowed.");
    }

    const res = await fetch(trimmed);
    if (!res.ok) {
      throw new Error(`Failed to fetch theme: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    this.#validateThemeJson(json);

    // 確認ダイアログ
    const dialog = window.System?.dialog;
    if (dialog) {
      const varCount = Object.keys(json.vars || {}).length;
      const i18n = window.System?.i18n;
      const approved = await dialog.confirm({
        title: i18n?.t("settings.appearance.importConfirmTitle") || "外部テーマのインポート",
        message: i18n?.t("settings.appearance.importConfirmMsg", {
          name: json.name,
          varCount,
        }) || `テーマ「${json.name}」をインポートして適用しますか？\n変更される変数数: ${varCount}`,
        okText: i18n?.t("settings.appearance.importAndApply") || "インポートして適用",
        cancelText: i18n?.t("dialog.cancel") || "キャンセル",
        icon: "palette",
      });
      if (!approved) {
        throw new Error(i18n?.t("settings.appearance.importCancelled") || "Theme import cancelled by user");
      }
    }

    this.#importedThemes.set(json.id, json);
    this.apply(json.id);
    if (json.wallpaper) {
      this.setWallpaper(json.wallpaper);
    }
    await this.save();
    return json;
  }

  /**
   * システムデフォルトに戻す
   */
  reset() {
    this.#mode = "auto";
    this.#themeId = this.#mediaQuery?.matches ? "default-dark" : "default-light";
    this.#customVars = {};
    this.#wallpaper = "";
    this.#applyToDOM();
    this.#emitChange();
    this.save();
  }

  /**
   * 現在のテーマ設定を JSON 文字列としてエクスポート
   * @returns {string}
   */
  export() {
    const currentTheme = this.getTheme(this.#themeId);
    const exportData = {
      id: currentTheme?.id || "custom-theme",
      name: currentTheme?.name || "Custom Theme",
      dark: this.isDark,
      vars: this.vars,
      wallpaper: this.wallpaper,
    };
    return JSON.stringify(exportData, null, 2);
  }

  // ─── DOM 適用とイベント ──────────────────────────────────────────────────

  #ensureStyleElement() {
    if (!this.#styleEl) {
      this.#styleEl = document.getElementById("eskit-theme-vars");
      if (!this.#styleEl) {
        this.#styleEl = document.createElement("style");
        this.#styleEl.id = "eskit-theme-vars";
        document.head.appendChild(this.#styleEl);
      }
    }
  }

  #applyToDOM() {
    this.#ensureStyleElement();

    const isDark = this.isDark;
    document.documentElement.classList.toggle("kit-dark", isDark);
    document.documentElement.classList.toggle("kit-light", !isDark);

    const activeVars = this.vars;
    const wallpaperVal = this.wallpaper;

    let cssRules = ":root {\n";
    for (const [k, v] of Object.entries(activeVars)) {
      cssRules += `  ${k}: ${v};\n`;
    }
    if (wallpaperVal) {
      cssRules += `  --eskit-wallpaper: ${wallpaperVal};\n`;
    }
    cssRules += "}\n";

    this.#styleEl.textContent = cssRules;

    // body の background にも即時反映
    if (wallpaperVal) {
      document.body.style.background = wallpaperVal;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundRepeat = "no-repeat";
    } else {
      document.body.style.background = "";
    }
  }

  #emitChange() {
    window.System?.events?.emit("system:theme-changed", {
      id: this.#themeId,
      mode: this.#mode,
      dark: this.isDark,
      vars: this.vars,
      wallpaper: this.wallpaper,
    });
  }

  #validateThemeJson(json) {
    if (!json || typeof json !== "object") {
      throw new Error("Invalid theme format: Expected JSON object");
    }
    if (!json.id || typeof json.id !== "string") {
      throw new Error("Theme validation failed: 'id' is required");
    }
    if (!json.name || typeof json.name !== "string") {
      throw new Error("Theme validation failed: 'name' is required");
    }
    if (!json.vars || typeof json.vars !== "object") {
      throw new Error("Theme validation failed: 'vars' object is required");
    }
    for (const key of Object.keys(json.vars)) {
      if (!key.startsWith("--kit-") && !key.startsWith("--eskit-")) {
        throw new Error(`Security validation failed: Invalid CSS variable key '${key}'`);
      }
    }
  }
}
