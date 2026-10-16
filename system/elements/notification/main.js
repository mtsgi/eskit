import style from "./style.js";
import kitstrap2Sheet from "system/kitstrap2.js";

/**
 * ESKitNotificationElement — 個別の通知トースト要素
 */
export class ESKitNotificationElement extends HTMLElement {
  #timeoutId = null;
  #toastEl = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#adoptStyle();
    this.#bindEvents();
    this.#startTimer();
  }

  disconnectedCallback() {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }
  }

  dismiss() {
    if (this.#toastEl) {
      this.#toastEl.classList.add("-closing");
      setTimeout(() => {
        this.remove();
      }, 250);
    } else {
      this.remove();
    }
  }

  #render() {
    const defaultTitle = window.System?.i18n?.t("notifications.title") || "Notification";
    const title = this.getAttribute("title") || defaultTitle;
    const message = this.getAttribute("message") || "";
    const type = this.getAttribute("type") || "info"; // "info" | "success" | "warning" | "error"
    const iconName = this.getAttribute("icon") || this.#defaultIconFor(type);
    const actionLabel = this.getAttribute("action-label");
    const closeAria = window.System?.i18n?.t("system.close") || "Close";

    this.shadowRoot.innerHTML = `
      <div class="toast -${type}" id="toast" role="alert">
        <div class="icon-wrapper">
          <eskit-icon set="lucide" name="${iconName}" size="18"></eskit-icon>
        </div>
        <div class="content">
          <div class="title">${this.#esc(title)}</div>
          ${message ? `<div class="message">${this.#esc(message)}</div>` : ""}
          ${actionLabel ? `<button id="action-btn" class="kit-button -alt action-btn">${this.#esc(actionLabel)}</button>` : ""}
        </div>
        <button id="close-btn" class="close-btn" aria-label="${this.#esc(closeAria)}">
          <eskit-icon set="lucide" name="x" size="14"></eskit-icon>
        </button>
      </div>
    `;

    this.#toastEl = this.shadowRoot.getElementById("toast");
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }

  #bindEvents() {
    this.shadowRoot.getElementById("close-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.dismiss();
    });

    this.shadowRoot.getElementById("action-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.dispatchEvent(new CustomEvent("action", { bubbles: true, composed: true }));
      this.dismiss();
    });

    this.#toastEl?.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("click", { bubbles: true, composed: true }));
    });
  }

  #startTimer() {
    const durationAttr = this.getAttribute("duration");
    const duration = durationAttr !== null ? parseInt(durationAttr, 10) : 5000;

    if (duration > 0) {
      this.#timeoutId = setTimeout(() => {
        this.dismiss();
      }, duration);
    }
  }

  #defaultIconFor(type) {
    switch (type) {
      case "success": return "check-circle";
      case "warning": return "alert-triangle";
      case "error":   return "alert-circle";
      case "info":
      default:        return "info";
    }
  }

  #esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

/**
 * ESKitNotificationContainerElement — 通知コンテナ (画面右上固定)
 */
export default class ESKitNotificationContainerElement extends HTMLElement {
  #offModeChanged = null;
  #offNotificationShow = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#adoptStyle();
    this.#bindEvents();
    this.#syncMode();
  }

  disconnectedCallback() {
    this.#offModeChanged?.();
    this.#offNotificationShow?.();
  }

  /**
   * 通知トーストを追加して表示する
   * @param {{ title?: string, message?: string, type?: string, duration?: number, icon?: string, action?: { label: string, onClick?: () => void } }} opts
   */
  show(opts = {}) {
    const toast = document.createElement("eskit-notification");
    if (opts.title) toast.setAttribute("title", opts.title);
    if (opts.message) toast.setAttribute("message", opts.message);
    if (opts.type) toast.setAttribute("type", opts.type);
    if (typeof opts.duration === "number") toast.setAttribute("duration", String(opts.duration));
    if (opts.icon) toast.setAttribute("icon", opts.icon);
    if (opts.action?.label) toast.setAttribute("action-label", opts.action.label);

    if (typeof opts.action?.onClick === "function") {
      toast.addEventListener("action", () => opts.action.onClick());
    }

    this.shadowRoot.appendChild(toast);
    return toast;
  }

  #adoptStyle() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, sheet];
  }

  #bindEvents() {
    const sys = window.System;
    if (sys) {
      this.#offNotificationShow = sys.events.on("notification:show", (opts) => {
        this.show(opts);
      });
      this.#offModeChanged = sys.events.on("shell:mode-changed", () => {
        this.#syncMode();
      });
    }
  }

  #syncMode() {
    const isMobile = window.System?.shellMode.isMobile ?? false;
    if (isMobile) {
      this.setAttribute("mode", "mobile");
    } else {
      this.removeAttribute("mode");
    }
  }
}
