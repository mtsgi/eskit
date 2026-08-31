import style from "./style.js";
import createTemplate from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";
import { HamonScope } from "system/hamon.js";

/**
 * ESKitPermissionDialogElement — 権限確認ダイアログ
 */
export default class ESKitPermissionDialogElement extends HTMLElement {
  #resolve = null;
  #scope = null;
  #currentAppName = "";
  #currentPermission = "";
  #offLocale = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.#scope = new HamonScope();
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#bindEvents();
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this.#onKeyDown);
    this.#offLocale?.();
    this.#scope?.dispose();
  }

  // ─── パブリック API ────────────────────────────────────────────────────────

  request(appName, permission) {
    if (this.#resolve) {
      this.#resolve(false);
      this.#resolve = null;
    }

    this.#currentAppName = appName;
    this.#currentPermission = permission;

    return new Promise((resolve) => {
      this.#resolve = resolve;
      this.#update(appName, permission);
      this.setAttribute("open", "");
    });
  }

  // ─── 内部実装 ────────────────────────────────────────────────────────────

  #render() {
    const frag = createTemplate(this.#scope);
    this.shadowRoot.replaceChildren(frag);
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }

  #bindEvents() {
    this.shadowRoot.getElementById("btn-allow")?.addEventListener("click", () => this.#finish(true));
    this.shadowRoot.getElementById("btn-deny")?.addEventListener("click",  () => this.#finish(false));

    document.addEventListener("keydown", this.#onKeyDown);

    this.#offLocale = window.System?.events?.on("system:locale-changed", () => {
      if (this.hasAttribute("open")) {
        this.#update(this.#currentAppName, this.#currentPermission);
      }
    });
  }

  #onKeyDown = (e) => {
    if (this.hasAttribute("open") && e.key === "Escape") this.#finish(false);
  };

  #update(appName, permission) {
    const desc   = this.shadowRoot.getElementById("perm-desc");
    const badge  = this.shadowRoot.getElementById("perm-badge");
    const detail = this.shadowRoot.getElementById("perm-detail");

    if (desc) {
      desc.textContent = window.System?.i18n?.t("permissions.requestMessage", { appName }) || `${appName} が以下の権限を要求しています:`;
    }
    if (badge) {
      badge.textContent = permission;
    }
    if (detail) {
      detail.textContent = window.System?.i18n?.getPermissionDescription(permission) || "";
    }
  }

  #finish(granted) {
    if (!this.#resolve) return;
    this.removeAttribute("open");
    const resolve = this.#resolve;
    this.#resolve = null;
    resolve(granted);
  }
}
