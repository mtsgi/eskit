import style from "./style.js";
import createTemplate from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";
import { HamonScope } from "system/hamon.js";

/**
 * ESKitLoginScreenElement — ログイン画面
 */
export default class ESKitLoginScreenElement extends HTMLElement {
  #resolve = null;
  #scope = null;
  #offLocale = null;
  #currentUsers = [];

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
    this.#offLocale?.();
    this.#scope?.dispose();
  }

  requestLogin(users, errorMessage = "") {
    this.setAttribute("open", "");
    this.#currentUsers = users || [];

    const subText = window.System?.i18n?.t("login.subtitleLogin") || "サインインしてセッションを開始してください";
    const btnText = window.System?.i18n?.t("login.loginButton") || "ログイン";

    this.#setSubtitle(subText);
    this.#setSubmitLabel(btnText);
    this.#setError(errorMessage);

    const selectEl = this.shadowRoot.getElementById("login-user-id");
    const pwEl = this.shadowRoot.getElementById("password");

    selectEl.innerHTML = "";
    for (const user of users) {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = `${user.name} (${user.id})${user.isAdmin ? " [admin]" : ""}`;
      selectEl.appendChild(option);
    }

    pwEl.value = "";
    selectEl.focus();

    return new Promise((resolve) => {
      this.#resolve = resolve;
    });
  }

  setError(message) {
    this.#setError(message);
  }

  hide() {
    this.removeAttribute("open");
  }

  // ─── 内部 ──────────────────────────────────────────────────────────────

  #bindEvents() {
    const formEl = this.shadowRoot.getElementById("form");
    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.#resolve) return;
      this.#onLoginSubmit();
    });

    this.#offLocale = window.System?.events?.on("system:locale-changed", () => {
      if (this.hasAttribute("open")) {
        const subText = window.System?.i18n?.t("login.subtitleLogin") || "サインインしてセッションを開始してください";
        const btnText = window.System?.i18n?.t("login.loginButton") || "ログイン";
        this.#setSubtitle(subText);
        this.#setSubmitLabel(btnText);
      }
    });
  }

  #onLoginSubmit() {
    const id = this.shadowRoot.getElementById("login-user-id").value;
    const password = this.shadowRoot.getElementById("password").value;

    if (!id) {
      this.#setError(window.System?.i18n?.t("login.errUserNotFound") || "ユーザーを選択してください");
      return;
    }

    this.#setError("");
    this.#finish({ id, password });
  }

  #setSubtitle(text) {
    const el = this.shadowRoot.getElementById("subtitle");
    if (el) el.textContent = text;
  }

  #setSubmitLabel(text) {
    const el = this.shadowRoot.getElementById("submit");
    if (el) {
      el.innerHTML = `<span class="kit-flex kit-flex-middle kit-gap-xs"><span>${text}</span><eskit-icon set="lucide" name="arrow-right" size="14"></eskit-icon></span>`;
    }
  }

  #setError(message) {
    const el = this.shadowRoot.getElementById("error");
    if (el) el.textContent = message;
  }

  #finish(payload) {
    if (!this.#resolve) return;
    const resolve = this.#resolve;
    this.#resolve = null;
    this.hide();
    resolve(payload);
  }

  #render() {
    const frag = createTemplate(this.#scope);
    this.shadowRoot.replaceChildren(frag);
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }
}
