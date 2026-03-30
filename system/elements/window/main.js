import style    from "./style.js";
import template from "./template.js";
import kitstrap2Sheet from "system/kitstrap2.js";

const MIN_W = 220;
const MIN_H = 120;
const SNAP_EDGE = 8;

/**
 * ESKitWindowElement — アプリウィンドウ
 *
 * 属性:
 *   mode   — "desktop" | "mobile"  (レイアウト切替)
 *   active — mobile モードで全画面表示するかどうか (boolean)
 *
 * 状態:
 *   normal / minimized / maximized
 *   (snapped は normal の一種。_prevRect で復元)
 */
export default class ESKitWindowElement extends HTMLElement {
  _state    = "normal";
  _prevRect = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["mode", "active"];
  }

  connectedCallback() {
    this.render();
    this.#bindControls();
    this.#initDrag();
    this.#initResize();

    // デスクトップモードでクリック時にフォーカスを取得
    this.addEventListener("pointerdown", () => {
      if (this.getAttribute("mode") !== "mobile") {
        window.System?.WindowSystem?.activateWindow(this.id);
      }
    });
  }

  attributeChangedCallback() {
    // 属性変更は CSS :host([mode="?"]) / :host([active]) が制御
  }

  render() {
    this.shadowRoot.innerHTML = template;

    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [kitstrap2Sheet, styleSheet];
  }

  // ─── パブリック API ────────────────────────────────────────────────────────

  /**
   * ウィンドウタイトルを更新する。
   * @param {string} title
   */
  setTitle(title) {
    const el = this.shadowRoot?.querySelector(".app-title");
    if (el) el.textContent = title;
  }

  /**
   * ウィンドウを最前面にフォーカスする。
   */
  focus() {
    const ws = window.System?.WindowSystem;
    if (!ws) return;
    this.style.zIndex = window.System.nextZIndex();
    // focused クラスを排他的に管理
    for (const [, win] of ws._getAllElements()) {
      win.classList.toggle("focused", win === this);
    }
  }

  /**
   * ウィンドウを最小化する。
   */
  minimize() {
    if (this._state === "minimized") return;
    this._state = "minimized";
    this.classList.add("minimized");
  }

  /**
   * ウィンドウを最大化する。
   */
  maximize() {
    if (this._state === "maximized") return;
    this.#savePrevRect();
    this.#clearSnapClasses();
    this._state = "maximized";
    this.classList.add("maximized");
    this.shadowRoot.querySelector(".btn-maximize").textContent = "❐";
  }

  /**
   * ウィンドウを通常状態に復元する。
   */
  restore() {
    const prev = this._state;
    this._state = "normal";
    this.classList.remove("minimized", "maximized");
    this.#clearSnapClasses();
    this.shadowRoot.querySelector(".btn-maximize").textContent = "□";

    if (prev !== "minimized" && this._prevRect) {
      this.#applyRect(this._prevRect);
      this._prevRect = null;
    }
  }

  /**
   * ウィンドウを画面の左半分または右半分にスナップする。
   * @param {"left"|"right"} side
   */
  snap(side) {
    if (this._state === "maximized" || this._state === "minimized") {
      this.restore();
    }
    this.#savePrevRect();
    this.#clearSnapClasses();
    this.classList.add(side === "left" ? "snapped-left" : "snapped-right");
  }

  // ─── ウィンドウコントロールボタン ─────────────────────────────────────────

  #bindControls() {
    this.shadowRoot.querySelector(".btn-minimize")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.minimize();
    });

    this.shadowRoot.querySelector(".btn-maximize")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this._state === "maximized") {
        this.restore();
      } else {
        this.maximize();
      }
    });

    // タイトルバーダブルクリックで最大化/復元トグル
    this.shadowRoot.querySelector(".app-header")?.addEventListener("dblclick", (e) => {
      if (e.target.closest(".app-controls")) return;
      if (this._state === "maximized") {
        this.restore();
      } else {
        this.maximize();
      }
    });
  }

  // ─── ドラッグ ─────────────────────────────────────────────────────────────

  #initDrag() {
    const header = this.shadowRoot.querySelector(".app-header");
    if (!header) return;

    let startX, startY, startLeft, startTop;
    let dragging = false;

    header.addEventListener("pointerdown", (e) => {
      // コントロールボタンは除外
      if (e.target.closest(".app-controls")) return;
      if (this.getAttribute("mode") === "mobile") return;
      if (this._state === "maximized") return;

      // スナップ状態からドラッグ開始時はスナップを解除する
      const wasSnapped = this.classList.contains("snapped-left") || this.classList.contains("snapped-right");
      if (wasSnapped) {
        this.restore();
      }

      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = this.offsetLeft;
      startTop = this.offsetTop;
      header.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    header.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      this.style.left = `${startLeft + dx}px`;
      this.style.top  = `${startTop + dy}px`;

      // スナッププレビュー表示
      const ws = window.System?.WindowSystem;
      if (ws) {
        const zone = this.#detectSnapZone(e.clientX, e.clientY);
        ws.showSnapPreview(zone);
      }
    });

    header.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      header.releasePointerCapture(e.pointerId);

      // プレビューを非表示
      const ws = window.System?.WindowSystem;
      ws?.showSnapPreview(null);

      // スナップ判定
      if (e.clientY <= SNAP_EDGE) {
        this.maximize();
      } else if (e.clientX <= SNAP_EDGE) {
        this.snap("left");
        ws?.showSnapAssist("left", this.id);
      } else if (e.clientX >= window.innerWidth - SNAP_EDGE) {
        this.snap("right");
        ws?.showSnapAssist("right", this.id);
      }
    });
  }

  // ─── リサイズ ─────────────────────────────────────────────────────────────

  #initResize() {
    const handles = this.shadowRoot.querySelectorAll(".resize-handle");
    for (const handle of handles) {
      this.#attachResizeHandle(handle);
    }
  }

  #attachResizeHandle(handle) {
    let startX, startY, startRect;
    let resizing = false;

    // ハンドルの方向を判定
    const dirs = handle.className.replace("resize-handle resize-", "");

    handle.addEventListener("pointerdown", (e) => {
      if (this.getAttribute("mode") === "mobile") return;
      if (this._state === "maximized") return;

      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startRect = {
        left:   this.offsetLeft,
        top:    this.offsetTop,
        width:  this.offsetWidth,
        height: this.offsetHeight,
      };
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    });

    handle.addEventListener("pointermove", (e) => {
      if (!resizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let { left, top, width, height } = startRect;

      if (dirs.includes("e")) {
        width = Math.max(MIN_W, startRect.width + dx);
      }
      if (dirs.includes("w")) {
        const newW = Math.max(MIN_W, startRect.width - dx);
        left = startRect.left + (startRect.width - newW);
        width = newW;
      }
      if (dirs.includes("s")) {
        height = Math.max(MIN_H, startRect.height + dy);
      }
      if (dirs.includes("n")) {
        const newH = Math.max(MIN_H, startRect.height - dy);
        top = startRect.top + (startRect.height - newH);
        height = newH;
      }

      this.style.left   = `${left}px`;
      this.style.top    = `${top}px`;
      this.style.width  = `${width}px`;
      this.style.height = `${height}px`;
    });

    handle.addEventListener("pointerup", (e) => {
      if (!resizing) return;
      resizing = false;
      handle.releasePointerCapture(e.pointerId);
    });
  }

  // ─── ユーティリティ ────────────────────────────────────────────────────────

  #savePrevRect() {
    if (!this._prevRect) {
      this._prevRect = {
        left:   this.offsetLeft,
        top:    this.offsetTop,
        width:  this.offsetWidth,
        height: this.offsetHeight,
      };
    }
  }

  #applyRect({ left, top, width, height }) {
    this.style.left   = `${left}px`;
    this.style.top    = `${top}px`;
    this.style.width  = `${width}px`;
    this.style.height = `${height}px`;
  }

  #clearSnapClasses() {
    this.classList.remove("snapped-left", "snapped-right");
  }

  #detectSnapZone(clientX, clientY) {
    if (clientY <= SNAP_EDGE) return "maximize";
    if (clientX <= SNAP_EDGE) return "left";
    if (clientX >= window.innerWidth - SNAP_EDGE) return "right";
    return null;
  }
}
