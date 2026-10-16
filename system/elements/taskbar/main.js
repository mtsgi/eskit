import style from "./style.js";
import createTemplate from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";
import { HamonScope } from "system/hamon.js";

/**
 * ESKitTaskbarElement — デスクトップモード用タスクバー
 */
export default class ESKitTaskbarElement extends HTMLElement {
  #offOpened = null;
  #offClosed = null;
  #offFocused = null;
  #offTitleChanged = null;
  #offLocale = null;
  #clockTimer = null;
  #scope = null;

  /**
   * タスクバーの Shadow DOM とリアクティブ処理のスコープを作成する。
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.#scope = new HamonScope();
  }

  /** @returns {string[]} 表示モードの変更を受け取るための監視属性。 */
  static get observedAttributes() {
    return ["mode"];
  }

  /**
   * タスクバーを描画し、操作・アプリ状態・時計の更新を開始する。
   */
  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#bindEvents();
    this.#startClock();
  }

  /**
   * アプリ状態の購読、リアクティブ処理、時計のタイマーを解除する。
   */
  disconnectedCallback() {
    this.#offOpened?.();
    this.#offClosed?.();
    this.#offFocused?.();
    this.#offTitleChanged?.();
    this.#offLocale?.();
    this.#scope?.dispose();
    if (this.#clockTimer != null) {
      clearInterval(this.#clockTimer);
      this.#clockTimer = null;
    }
  }

  /**
   * モード属性の変更を受け取る。表示の切替は CSS に委ねる。
   */
  attributeChangedCallback() {
    // CSS :host([mode="mobile"]) が display を制御
  }

  // ─── 描画 ───────────────────────────────────────────────────────────────

  /**
   * タスクバーのテンプレートを Shadow DOM に描画する。
   */
  #render() {
    const frag = createTemplate(this.#scope);
    this.shadowRoot.replaceChildren(frag);
  }

  /**
   * 共通スタイルとタスクバー固有のスタイルを適用する。
   */
  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }

  // ─── イベント ──────────────────────────────────────────────────────────

  /**
   * シェル操作とアプリの起動・終了・タイトル変更の購読を登録する。
   */
  #bindEvents() {
    this.shadowRoot.getElementById("launcher-btn")?.addEventListener("click", () => {
      window.System?.events.emit("launcher:toggle");
    });

    this.shadowRoot.getElementById("clock")?.addEventListener("click", () => {
      window.System?.WindowSystem?.quickSettings?.toggle();
    });

    const sys = window.System;
    if (!sys) return;

    this.#offOpened = sys.events.on("app:opened", ({ uuid, name, icon }) => {
      // ファイル名などを含む起動後のタイトルを、マニフェスト名で上書きしない。
      const displayName = sys.getApp(uuid)?.windowTitle ?? name;
      this.#addAppButton(uuid, displayName, icon);
    });

    this.#offClosed = sys.events.on("app:closed", ({ uuid }) => {
      this.#removeAppButton(uuid);
    });

    this.#offFocused = sys.events.on("app:focused", ({ uuid }) => {
      this.#setActive(uuid);
    });

    this.#offTitleChanged = sys.events.on("app:titleChanged", ({ uuid, title }) => {
      this.#updateAppButton(uuid, title);
    });

    this.#offLocale = sys.events.on("system:locale-changed", () => {
      this.#updateClock();
      this.#refreshAppButtons();
    });
  }

  /**
   * 言語変更後も各アプリの現在のウィンドウタイトルを表示する。
   */
  #refreshAppButtons() {
    const container = this.shadowRoot.getElementById("taskbar-apps");
    if (!container) return;

    for (const btn of container.querySelectorAll(".app-btn")) {
      const uuid = btn.dataset.uuid;
      const app = window.System?.getApp(uuid);
      if (app) {
        const label = btn.querySelector(".app-btn-label");
        // 翻訳済みの自動タイトルと、アプリ独自の動的タイトルのどちらもそのまま使う。
        if (label) label.textContent = app.windowTitle;
      }
    }
  }

  // ─── アプリボタン管理 ─────────────────────────────────────────────────

  /**
   * 起動したアプリのボタンを追加し、クリックによるウィンドウ切替を登録する。
   * @param {string} uuid アプリの UUID。
   * @param {string} name 現在のウィンドウタイトル。
   * @param {object|null} icon アプリのアイコン定義。
   */
  #addAppButton(uuid, name, icon) {
    const container = this.shadowRoot.getElementById("taskbar-apps");
    if (!container) return;

    const btn = document.createElement("button");
    btn.className = "app-btn";
    btn.dataset.uuid = uuid;

    const iconEl = window.System?.icons?.createAppIcon(icon, { size: 16 });
    if (iconEl) btn.appendChild(iconEl);

    const label = document.createElement("span");
    label.className = "app-btn-label";
    label.textContent = name;
    btn.appendChild(label);

    btn.addEventListener("click", () => {
      window.System?.WindowSystem?.activateWindow(uuid);
    });
    container.appendChild(btn);

    this.#setActive(uuid);
  }

  /**
   * 終了したアプリのボタンを削除する。
   * @param {string} uuid アプリの UUID。
   */
  #removeAppButton(uuid) {
    const container = this.shadowRoot.getElementById("taskbar-apps");
    if (!container) return;
    const btn = container.querySelector(`[data-uuid="${CSS.escape(uuid)}"]`);
    btn?.remove();
  }

  /**
   * アプリのボタンに表示するタイトルを更新する。
   * @param {string} uuid アプリの UUID。
   * @param {string} title 更新後のタイトル。
   */
  #updateAppButton(uuid, title) {
    const container = this.shadowRoot.getElementById("taskbar-apps");
    if (!container) return;
    const btn = container.querySelector(`[data-uuid="${CSS.escape(uuid)}"]`);
    if (btn) {
      const label = btn.querySelector(".app-btn-label");
      if (label) {
        label.textContent = title;
      } else {
        btn.textContent = title;
      }
    }
  }

  /**
   * 指定したアプリのボタンだけをアクティブ表示にする。
   * @param {string} uuid アクティブなアプリの UUID。
   */
  #setActive(uuid) {
    const container = this.shadowRoot.getElementById("taskbar-apps");
    if (!container) return;
    for (const btn of container.querySelectorAll(".app-btn")) {
      btn.classList.toggle("-active", btn.dataset.uuid === uuid);
    }
  }

  // ─── 時計 ─────────────────────────────────────────────────────────────

  /**
   * 時計を即時更新し、定期更新のタイマーを開始する。
   */
  #startClock() {
    this.#updateClock();
    this.#clockTimer = setInterval(() => this.#updateClock(), 10_000);
  }

  /**
   * 現在の言語で時刻を表示し、日付をツールチップへ設定する。
   */
  #updateClock() {
    const el = this.shadowRoot.getElementById("clock");
    if (!el) return;
    const now = new Date();
    el.textContent = window.System?.i18n?.formatTime(now) || now.toLocaleTimeString();
    el.title = window.System?.i18n?.formatDate(now) || now.toLocaleDateString();
  }
}
