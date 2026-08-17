import style from "./style.js";
import template from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";

/**
 * ESKitLoginScreenElement — 初期管理者作成 / ログイン画面
 */
export default class ESKitLoginScreenElement extends HTMLElement {
  #resolve = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#bindEvents();
  }

  requestLogin(users, errorMessage = "") {
    this.setAttribute("open", "");

    this.#setSubtitle("ログインするユーザーとパスワードを入力してください");
    this.#setSubmitLabel("ログイン");
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
  }

  #onLoginSubmit() {
    const id = this.shadowRoot.getElementById("login-user-id").value;
    const password = this.shadowRoot.getElementById("password").value;

    if (!id) {
      this.#setError("ユーザーを選択してください");
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
    if (el) el.textContent = text;
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
    this.shadowRoot.innerHTML = template;
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }
}
