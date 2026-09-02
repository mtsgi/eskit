import style    from "./style.js";
import createTemplate from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";
import { HamonScope } from "system/hamon.js";

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
  #offLocale = null;
  #currentUuid = null;
  #scope = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.#scope = new HamonScope();
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
    this.#offFocus?.();
    this.#offClose?.();
    this.#offLocale?.();
    this.#scope?.dispose();
  }

  attributeChangedCallback() {
  }

  // ─── 描画 ───────────────────────────────────────────────────────────────

  #render() {
    const frag = createTemplate(this.#scope);
    this.shadowRoot.replaceChildren(frag);
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }

  // ─── イベント ──────────────────────────────────────────────────────────

  #bindEvents() {
    this.shadowRoot.getElementById("home-btn")?.addEventListener("click", () => {
      window.System?.WindowSystem?.drawer?.toggle();
    });

    const sys = window.System;
    if (!sys) return;

    this.#offFocus = sys.events.on("app:focused", ({ uuid }) => {
      this.#currentUuid = uuid;
      this.#updateCurrentApp();
    });

    this.#offClose = sys.events.on("app:closed", () => {
      this.#currentUuid = null;
      this.#setCurrentApp("");
    });

    this.#offLocale = sys.events.on("system:locale-changed", () => {
      this.#updateCurrentApp();
    });
  }

  #updateCurrentApp() {
    if (!this.#currentUuid) {
      this.#setCurrentApp("");
      return;
    }
    const sys = window.System;
    const app = sys?.getApp(this.#currentUuid);
    const name = app ? (sys?.i18n?.getAppName(app._manifest) || app.name) : "";
    this.#setCurrentApp(name);
  }

  #setCurrentApp(name) {
    const el = this.shadowRoot.getElementById("current-app-name");
    if (el) el.textContent = name;
  }
}
