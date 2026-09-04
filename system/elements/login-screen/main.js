import style from "./style.js";
import createTemplate from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";
import { signal, computed, HamonScope } from "system/hamon.js";

/**
 * ESKitLoginScreenElement — ログイン画面
 */
export default class ESKitLoginScreenElement extends HTMLElement {
  #resolve = null;
  #scope = null;
  #currentUsers = [];
  #errorMessage = signal("");
  #isFirstAdmin = signal(false);

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.#scope = new HamonScope();
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
  }

  disconnectedCallback() {
    this.#scope?.dispose();
  }

  get subtitle() {
    return computed(() => {
      const i18n = window.System?.i18n;
      if (!i18n) return "サインインしてセッションを開始してください";
      return i18n.t(this.#isFirstAdmin.value ? "login.subtitleFirstAdmin" : "login.subtitleLogin");
    });
  }

  get submitLabel() {
    return computed(() => {
      const i18n = window.System?.i18n;
      if (!i18n) return "ログイン";
      return i18n.t(this.#isFirstAdmin.value ? "login.createAdminButton" : "login.loginButton");
    });
  }

  get errorMessage() {
    return this.#errorMessage;
  }

  toggleLanguage() {
    const i18n = window.System?.i18n;
    if (!i18n) return;
    const next = i18n.locale.value === "ja" ? "en" : "ja";
    i18n.setLocale(next);
  }

  handleSubmit(e) {
    if (e) e.preventDefault();
    if (!this.#resolve) return;
    this.#onLoginSubmit();
  }

  requestLogin(users, errorMessage = "") {
    this.setAttribute("open", "");
    this.#currentUsers = users || [];
    this.#isFirstAdmin.value = this.#currentUsers.length === 0;
    this.#errorMessage.value = errorMessage || "";

    const selectEl = this.shadowRoot.getElementById("login-user-id");
    const pwEl = this.shadowRoot.getElementById("password");

    if (selectEl) {
      selectEl.innerHTML = "";
      for (const user of this.#currentUsers) {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = `${user.name} (${user.id})${user.isAdmin ? " [admin]" : ""}`;
        selectEl.appendChild(option);
      }
      selectEl.focus();
    }

    if (pwEl) {
      pwEl.value = "";
    }

    return new Promise((resolve) => {
      this.#resolve = resolve;
    });
  }

  setError(message) {
    this.#errorMessage.value = message || "";
  }

  hide() {
    this.removeAttribute("open");
    this.#errorMessage.value = "";
  }

  // ─── 内部 ──────────────────────────────────────────────────────────────

  #onLoginSubmit() {
    const selectEl = this.shadowRoot.getElementById("login-user-id");
    const id = selectEl ? selectEl.value : "";
    const pwEl = this.shadowRoot.getElementById("password");
    const password = pwEl ? pwEl.value : "";

    if (!id && this.#currentUsers.length > 0) {
      this.#errorMessage.value = window.System?.i18n?.t("login.errUserNotFound") || "ユーザーを選択してください";
      return;
    }

    this.#errorMessage.value = "";
    this.#finish({ id, password });
  }

  #finish(payload) {
    if (!this.#resolve) return;
    const resolve = this.#resolve;
    this.#resolve = null;
    this.hide();
    resolve(payload);
  }

  #render() {
    const frag = createTemplate(this);
    this.shadowRoot.replaceChildren(frag);
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }
}
