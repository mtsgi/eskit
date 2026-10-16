import style from "./style.js";
import template from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";

/**
 * ESKitDialogElement — システム汎用ダイアログ
 *
 * Popover / Modal 風の確認・メッセージ・入力ダイアログ。
 * Web Component として Shadow DOM 内に描画し、Promise で結果を返す。
 */
export default class ESKitDialogElement extends HTMLElement {
  #resolve = null;
  #titleEl = null;
  #messageEl = null;
  #promptContainer = null;
  #promptInput = null;
  #customContainer = null;
  #actionsContainer = null;
  #iconEl = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#queryElements();
    this.#bindEvents();
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this.#onKeyDown);
  }

  // ─── パブリック API ────────────────────────────────────────────────────────

  /**
   * アラートダイアログを表示する。
   * @param {{ title?: string, message: string, okText?: string, icon?: string }} opts
   * @returns {Promise<void>}
   */
  alert({ title, message = "", okText, icon = "info" } = {}) {
    const resolvedTitle = title ?? window.System?.i18n?.t("dialog.alert") ?? "Alert";
    const resolvedOk = okText ?? window.System?.i18n?.t("dialog.ok") ?? "OK";
    return this.custom({
      title: resolvedTitle,
      message,
      icon,
      buttons: [{ id: "ok", label: resolvedOk, primary: true }],
    }).then(() => {});
  }

  /**
   * 確認ダイアログを表示する。
   * @param {{ title?: string, message: string, okText?: string, cancelText?: string, danger?: boolean, icon?: string }} opts
   * @returns {Promise<boolean>}
   */
  confirm({
    title,
    message = "",
    okText,
    cancelText,
    danger = false,
    icon = "help-circle",
  } = {}) {
    const resolvedTitle = title ?? window.System?.i18n?.t("dialog.confirm") ?? "Confirm";
    const resolvedOk = okText ?? window.System?.i18n?.t("dialog.ok") ?? "OK";
    const resolvedCancel = cancelText ?? window.System?.i18n?.t("dialog.cancel") ?? "Cancel";
    return this.custom({
      title: resolvedTitle,
      message,
      icon,
      buttons: [
        { id: "cancel", label: resolvedCancel, flat: true },
        { id: "ok", label: resolvedOk, primary: !danger, danger },
      ],
    }).then((res) => res === "ok");
  }

  /**
   * 入力ダイアログを表示する。
   * @param {{ title?: string, message?: string, defaultValue?: string, placeholder?: string, okText?: string, cancelText?: string, icon?: string }} opts
   * @returns {Promise<string|null>}
   */
  prompt({
    title,
    message = "",
    defaultValue = "",
    placeholder = "",
    okText,
    cancelText,
    icon = "edit-3",
  } = {}) {
    this.#cancelPending();
    const resolvedTitle = title ?? window.System?.i18n?.t("dialog.prompt") ?? "Input";
    const resolvedOk = okText ?? window.System?.i18n?.t("dialog.ok") ?? "OK";
    const resolvedCancel = cancelText ?? window.System?.i18n?.t("dialog.cancel") ?? "Cancel";

    return new Promise((resolve) => {
      this.#resolve = (res) => {
        if (res === "ok") {
          resolve(this.#promptInput.value);
        } else {
          resolve(null);
        }
      };

      this.#setupDialog({
        title: resolvedTitle,
        message,
        icon,
        showPrompt: true,
        defaultValue,
        placeholder,
        buttons: [
          { id: "cancel", label: resolvedCancel, flat: true },
          { id: "ok", label: resolvedOk, primary: true },
        ],
      });

      this.setAttribute("open", "");
      setTimeout(() => {
        this.#promptInput?.focus();
        this.#promptInput?.select();
      }, 50);
    });
  }

  /**
   * カスタムダイアログを表示する。
   * @param {{ title?: string, message?: string, icon?: string, content?: HTMLElement|DocumentFragment|string, buttons?: Array<{ id: string, label: string, primary?: boolean, danger?: boolean, flat?: boolean }> }} opts
   * @returns {Promise<string|null>} 押されたボタンの ID (キャンセル時は null)
   */
  custom({
    title,
    message = "",
    icon = "info",
    content = null,
    buttons,
  } = {}) {
    this.#cancelPending();
    const resolvedTitle = title ?? window.System?.i18n?.t("dialog.confirm") ?? "Dialog";
    const defaultOk = window.System?.i18n?.t("dialog.ok") ?? "OK";
    const resolvedButtons = buttons ?? [{ id: "ok", label: defaultOk, primary: true }];

    return new Promise((resolve) => {
      this.#resolve = resolve;

      this.#setupDialog({
        title: resolvedTitle,
        message,
        icon,
        content,
        buttons: resolvedButtons,
      });

      this.setAttribute("open", "");
      setTimeout(() => {
        const firstPrimary = this.#actionsContainer?.querySelector("button.-primary, button.-danger, button");
        firstPrimary?.focus();
      }, 50);
    });
  }

  /**
   * 汎用ファイル選択ダイアログを表示する。
   * @param {{ title?: string, startPath?: string, accepts?: string[] }} opts
   * @returns {Promise<string|null>}
   */
  showOpenFilePicker(opts) {
    return window.System?.showOpenFilePicker(opts) ?? null;
  }

  // ─── 内部実装 ────────────────────────────────────────────────────────────

  #cancelPending() {
    if (this.#resolve) {
      this.#resolve(null);
      this.#resolve = null;
    }
  }

  #setupDialog({
    title,
    message,
    icon,
    showPrompt = false,
    defaultValue = "",
    placeholder = "",
    content = null,
    buttons = [],
  }) {
    if (this.#titleEl) this.#titleEl.textContent = title;
    if (this.#messageEl) this.#messageEl.textContent = message;
    if (this.#iconEl) this.#iconEl.setAttribute("name", icon || "info");

    // Prompt
    if (this.#promptContainer && this.#promptInput) {
      if (showPrompt) {
        this.#promptContainer.classList.remove("kit-hidden");
        this.#promptInput.value = defaultValue;
        this.#promptInput.placeholder = placeholder;
      } else {
        this.#promptContainer.classList.add("kit-hidden");
      }
    }

    // Custom Content
    if (this.#customContainer) {
      this.#customContainer.replaceChildren();
      if (content) {
        this.#customContainer.classList.remove("kit-hidden");
        if (typeof content === "string") {
          this.#customContainer.textContent = content;
        } else if (content instanceof Node) {
          this.#customContainer.appendChild(content);
        }
      } else {
        this.#customContainer.classList.add("kit-hidden");
      }
    }

    // Buttons
    if (this.#actionsContainer) {
      this.#actionsContainer.replaceChildren();
      for (const btn of buttons) {
        const buttonEl = document.createElement("button");
        buttonEl.className = "kit-button";
        if (btn.primary) buttonEl.classList.add("-primary");
        if (btn.danger) buttonEl.classList.add("-danger");
        if (btn.flat) buttonEl.classList.add("-flat");
        buttonEl.textContent = btn.label;
        buttonEl.addEventListener("click", (e) => {
          e.stopPropagation();
          this.#finish(btn.id);
        });
        this.#actionsContainer.appendChild(buttonEl);
      }
    }
  }

  #finish(result) {
    if (!this.#resolve) return;
    this.removeAttribute("open");
    const resolve = this.#resolve;
    this.#resolve = null;
    resolve(result);
  }

  #render() {
    this.shadowRoot.innerHTML = template;
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }

  #queryElements() {
    this.#titleEl = this.shadowRoot.getElementById("dialog-title");
    this.#messageEl = this.shadowRoot.getElementById("dialog-message");
    this.#promptContainer = this.shadowRoot.getElementById("prompt-container");
    this.#promptInput = this.shadowRoot.getElementById("prompt-input");
    this.#customContainer = this.shadowRoot.getElementById("custom-container");
    this.#actionsContainer = this.shadowRoot.getElementById("actions-container");
    this.#iconEl = this.shadowRoot.getElementById("icon-el");
  }

  #bindEvents() {
    document.addEventListener("keydown", this.#onKeyDown);

    this.#promptInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.#finish("ok");
      }
    });

    // 背景（ダイアログカードの外側）クリックでキャンセル
    this.shadowRoot.addEventListener("pointerdown", (e) => {
      const card = this.shadowRoot.querySelector(".dialog-card");
      if (card && e.composedPath().includes(card)) return;
      this.#finish(null);
    });
  }

  #onKeyDown = (e) => {
    if (this.hasAttribute("open") && e.key === "Escape") {
      e.preventDefault();
      this.#finish(null);
    }
  };
}
