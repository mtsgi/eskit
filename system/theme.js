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
  #blobUrl = null;
  #resolvedWallpaper = "";
  #wallpaperRevision = 0; // 壁紙の解決処理の世代。新しい選択があれば古い完了結果を破棄する。
  #importedThemes = new Map(); // id -> ThemeMeta
  #styleEl = null;
  #mediaQuery = null;

  /** OS のカラーモードを監視し、auto モードの外観更新を登録する。 */
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

  /** @returns {"light"|"dark"|"auto"} 現在のカラーモード。 */
  get mode() {
    return this.#mode;
  }

  /** @returns {string} 選択中のテーマ ID。 */
  get current() {
    return this.#themeId;
  }

  /** @returns {string} カスタム壁紙、または選択中のテーマの壁紙。 */
  get wallpaper() {
    return this.#wallpaper || this.getTheme(this.#themeId)?.wallpaper || "";
  }

  /** @returns {string} Blob URL などに解決済みの壁紙の CSS 値。未解決時は元の値。 */
  get resolvedWallpaper() {
    return this.#resolvedWallpaper || this.wallpaper;
  }

  /** @returns {boolean} モード・テーマ指定・OS 設定から決めたダーク表示の状態。 */
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

  /** @returns {object[]} 組み込みテーマとインポート済みテーマの一覧。 */
  get list() {
    const builtin = THEME_PRESETS.map(t => ({ ...t, builtin: true }));
    const imported = [...this.#importedThemes.values()].map(t => ({ ...t, builtin: false }));
    return [...builtin, ...imported];
  }

  /** @returns {object[]} 選択可能な壁紙プリセットの一覧。 */
  get wallpapers() {
    return WALLPAPER_PRESETS;
  }

  /** @returns {Record<string, string>} テーマ変数にカスタム変数を重ねた現在値。 */
  get vars() {
    const theme = this.getTheme(this.#themeId);
    return {
      ...(theme?.vars ?? {}),
      ...this.#customVars,
    };
  }

  // ─── 初期化と永続化 ────────────────────────────────────────────────────────

  /**
   * 起動時・ログイン時に設定を読み込み、壁紙の解決後に外観へ反映する。
   * @returns {Promise<void>} 読込と反映の終了時に解決する。新しい壁紙処理が始まった場合は反映を省略する。
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

    if (!await this.#resolveWallpaper()) return;
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
   * プリセットまたはインポート済みテーマを、壁紙の解決後に適用する。
   * @param {string} id 適用するテーマの ID。
   * @returns {Promise<void>} 外観への反映後に解決する。新しい壁紙処理が始まった場合は反映を省略する。
   */
  async apply(id) {
    const theme = this.getTheme(id);
    if (!theme) {
      console.warn(`[ESKitTheme] Theme "${id}" not found.`);
      return;
    }
    this.#themeId = id;
    if (theme.wallpaper && !this.#wallpaper) {
      // テーマ独自の壁紙があれば反映
    }
    if (!await this.#resolveWallpaper()) return;
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
   * 壁紙を設定し、VFS の画像読込が必要な場合はその完了を待って反映する。
   * @param {string} value CSS background 値 (linear-gradient(...), url(...), #hex) または VFS パス (/home/...)
   * @returns {Promise<void>} 外観への反映後に解決する。新しい壁紙処理が始まった場合は反映を省略する。
   */
  async setWallpaper(value) {
    this.#wallpaper = value;
    if (!await this.#resolveWallpaper()) return;
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

  /** テーマ変数を書き込む style 要素を取得し、なければ作成する。 */
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

  /** 現在のテーマ変数・カラーモード・解決済み壁紙を DOM に反映する。 */
  #applyToDOM() {
    this.#ensureStyleElement();

    const isDark = this.isDark;
    document.documentElement.classList.toggle("kit-dark", isDark);
    document.documentElement.classList.toggle("kit-light", !isDark);

    const activeVars = this.vars;
    const wallpaperVal = this.#resolvedWallpaper || this.wallpaper;

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

  /** 現在の外観と解決済み壁紙を、設定画面などの購読先へ通知する。 */
  #emitChange() {
    window.System?.events?.emit("system:theme-changed", {
      id: this.#themeId,
      mode: this.#mode,
      dark: this.isDark,
      vars: this.vars,
      wallpaper: this.wallpaper,
      resolvedWallpaper: this.resolvedWallpaper,
    });
  }

  /**
   * 壁紙の値が VFS の絶対パスか判定する。
   * @param {*} val 壁紙として指定された値。
   * @returns {boolean} VFS の絶対パスの場合は true。
   */
  #isVfsPath(val) {
    if (!val || typeof val !== "string") return false;
    const trimmed = val.trim();
    return (
      trimmed.startsWith("/") &&
      !trimmed.startsWith("linear-gradient") &&
      !trimmed.startsWith("radial-gradient") &&
      !trimmed.startsWith("url(")
    );
  }

  /**
   * 画像ファイルの拡張子から Blob 用の MIME タイプを求める。
   * @param {string} filePath 画像ファイルのパス。
   * @returns {string} 対応する MIME タイプ。不明な拡張子は image/png。
   */
  #getMimeType(filePath) {
    const ext = filePath.includes(".") ? filePath.split(".").pop().toLowerCase() : "";
    switch (ext) {
      case "png": return "image/png";
      case "jpg":
      case "jpeg": return "image/jpeg";
      case "webp": return "image/webp";
      case "svg": return "image/svg+xml";
      case "gif": return "image/gif";
      case "bmp": return "image/bmp";
      case "ico": return "image/x-icon";
      default: return "image/png";
    }
  }

  /**
   * 現在の壁紙を CSS で使える値に解決し、不要になった Blob URL を解放する。
   * VFS の読込完了順が逆転しても、最新世代の処理だけが結果を更新する。
   * @returns {Promise<boolean>} 最新の選択を解決した場合は true。古い処理の場合は false。
   */
  async #resolveWallpaper() {
    const revision = ++this.#wallpaperRevision;
    const raw = this.#wallpaper || this.getTheme(this.#themeId)?.wallpaper || "";

    if (this.#isVfsPath(raw) && window.System?.fs) {
      try {
        if (await window.System.fs.exists(raw)) {
          const bytes = await window.System.fs.readFileAsBytes(raw);

          // 古い読込結果では Blob URL を作らず、最新の選択とその URL を保持する。
          if (revision !== this.#wallpaperRevision) return false;

          const mime = this.#getMimeType(raw);
          const blob = new Blob([bytes], { type: mime });
          if (this.#blobUrl) {
            URL.revokeObjectURL(this.#blobUrl);
          }
          this.#blobUrl = URL.createObjectURL(blob);
          this.#resolvedWallpaper = `url("${this.#blobUrl}")`;
          return true;
        } else {
          console.warn(`[ESKitTheme] VFS wallpaper file not found: ${raw}, falling back to theme default.`);
        }
      } catch (err) {
        console.warn(`[ESKitTheme] Failed to load wallpaper from VFS:`, err);
      }
    }

    if (revision !== this.#wallpaperRevision) return false;

    // CSS の壁紙や既定値に戻す場合も、前の画像の Blob URL は不要になる。
    if (this.#blobUrl) {
      URL.revokeObjectURL(this.#blobUrl);
      this.#blobUrl = null;
    }
    this.#resolvedWallpaper = raw && !this.#isVfsPath(raw)
      ? raw
      : (this.getTheme(this.#themeId)?.wallpaper || "");
    return true;
  }

  /**
   * インポートするテーマの必須項目と CSS 変数名を検証する。
   * @param {object} json 検証するテーマ定義。
   * @throws {Error} 必須項目または CSS 変数の名前空間が不正な場合。
   */
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
