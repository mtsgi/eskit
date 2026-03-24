import style    from "./style.js";
import template from "./template.js";

/**
 * ESKitHomeBarElement — モバイルモード用ホームバー
 *
 * 画面下部に固定表示され、ホームボタンとアクティブアプリ名を表示する。
 * ホームボタンを押すと eskit-drawer の toggle() を呼ぶ。
 *
 * 属性:
 *   mode — "desktop" | "mobile"  (ESKitWindowSystem が設定)
 */
export default class ESKitHomeBarElement extends HTMLElement {
  #offFocus = null;
  #offClose = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["mode"];
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#bindEvents();
  }

  disconnectedCallback() {
    // システムイベントの購読解除
    this.#offFocus?.();
    this.#offClose?.();
  }

  attributeChangedCallback() {
    // mode が変わっても CSS の :host([mode="mobile"]) が display を制御するため
    // JS 側では追加処置不要
  }

  // ─── 描画 ───────────────────────────────────────────────────────────────

  #render() {
    this.shadowRoot.innerHTML = template;
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  // ─── イベント ──────────────────────────────────────────────────────────

  #bindEvents() {
    this.shadowRoot.getElementById("home-btn").addEventListener("click", () => {
      window.System?.WindowSystem?.drawer?.toggle();
    });

    const sys = window.System;
    if (!sys) return;

    // アクティブアプリが変わったらタイトルを更新
    this.#offFocus = sys.events.on("app:focused", ({ uuid }) => {
      const name = sys.getApp(uuid)?.name ?? "";
      this.#setCurrentApp(name);
    });

    // アプリが閉じられたらタイトルをクリア
    this.#offClose = sys.events.on("app:closed", () => {
      this.#setCurrentApp("");
    });
  }

  #setCurrentApp(name) {
    const el = this.shadowRoot.getElementById("current-app-name");
    if (el) el.textContent = name;
  }
}
