import { css } from "system/util.js";

export default css`
  /* ─── desktop モード (default) ─────────────────────────── */

  :host {
    display: flex;
    flex-direction: column;
    position: absolute;
    border: 1px solid var(--eskit-color-border);
    border-radius: var(--kit-radius-m);
    background: var(--eskit-color-surface, var(--eskit-color-background));
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    min-width: 220px;
    min-height: 120px;
    /* ─── 開閉アニメーション ──────────────────────────── */
    opacity: 1;
    transform: scale(1);
    transition: opacity var(--kit-transition-normal) ease,
                transform var(--kit-transition-normal) ease;
  }

  @starting-style {
    :host {
      opacity: 0;
      transform: scale(0.92);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      transition: none;
    }
  }

  :host(.focused) {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
    border-color: var(--eskit-color-primary);
  }

  /* ─── 状態: 最小化 ──────────────────────────────────────── */

  :host(.minimized) {
    display: none;
  }

  /* ─── 状態: 最大化 ──────────────────────────────────────── */

  :host(.maximized) {
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: calc(100% - var(--eskit-taskbar-height, 48px)) !important;
    border-radius: 0;
    border: none;
  }

  /* ─── 状態: スナップ ─────────────────────────────────────── */

  :host(.snapped-left) {
    left: 0 !important;
    top: 0 !important;
    width: 50% !important;
    height: calc(100% - var(--eskit-taskbar-height, 48px)) !important;
    border-radius: 0;
  }

  :host(.snapped-right) {
    left: 50% !important;
    top: 0 !important;
    width: 50% !important;
    height: calc(100% - var(--eskit-taskbar-height, 48px)) !important;
    border-radius: 0;
  }

  /* ─── mobile モード ──────────────────────────────────────── */

  :host([mode="mobile"]) {
    display: none;
    position: fixed;
    inset: 0;
    bottom: var(--eskit-home-bar-height, 3.5rem);
    z-index: 10;
    flex-direction: column;
    border: none;
    border-radius: 0;
    box-shadow: none;
    min-width: 0;
    min-height: 0;
    /* インラインスタイルの left/top/width/height を無効化 */
    left: 0 !important;
    top: 0 !important;
    width: auto !important;
    height: auto !important;
  }

  :host([mode="mobile"][active]) {
    display: flex;
  }

  /* ─── ヘッダー ───────────────────────────────────────────── */

  .app-header {
    display: flex;
    align-items: center;
    padding: var(--kit-space-xs) var(--kit-space-s);
    background: var(--eskit-color-surface, var(--eskit-color-background));
    border-bottom: 1px solid var(--eskit-color-border);
    flex-shrink: 0;
    user-select: none;
    -webkit-user-select: none;
    cursor: default;
  }

  .app-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: var(--kit-space-xs);
    flex-shrink: 0;
    line-height: 1;
    pointer-events: none;
  }

  .app-title {
    font-size: var(--kit-font-size-s);
    font-weight: var(--kit-font-weight-bold);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    pointer-events: none;
  }

  :host([mode="mobile"]) .app-header {
    padding: var(--kit-space-m) var(--kit-space-l);
    cursor: default;
  }

  /* ─── ウィンドウコントロールボタン ─────────────────────── */

  .app-controls {
    display: flex;
    gap: var(--kit-space-xs);
    flex-shrink: 0;
  }

  .app-controls button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border: none;
    border-radius: var(--kit-radius-s);
    background: transparent;
    color: var(--eskit-color-text);
    font-size: 0.85rem;
    cursor: pointer;
    line-height: 1;
  }

  .app-controls button:hover {
    background: color-mix(in srgb, var(--eskit-color-text) 12%, transparent);
  }

  .btn-close:hover {
    background: var(--eskit-color-error, #e53935) !important;
    color: #fff !important;
  }

  :host([mode="mobile"]) .btn-minimize,
  :host([mode="mobile"]) .btn-maximize {
    display: none;
  }

  /* ─── アプリコンテンツ領域 ───────────────────────────────── */

  .app-template {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--eskit-color-surface, var(--eskit-color-background));
  }

  /* ─── リサイズハンドル ───────────────────────────────────── */

  .resize-handle {
    position: absolute;
    z-index: 1;
  }

  .resize-n  { top: -3px;    left: 8px;    right: 8px;   height: 6px;  cursor: n-resize;  }
  .resize-s  { bottom: -3px; left: 8px;    right: 8px;   height: 6px;  cursor: s-resize;  }
  .resize-e  { right: -3px;  top: 8px;     bottom: 8px;  width: 6px;   cursor: e-resize;  }
  .resize-w  { left: -3px;   top: 8px;     bottom: 8px;  width: 6px;   cursor: w-resize;  }
  .resize-ne { top: -3px;    right: -3px;  width: 12px;  height: 12px; cursor: ne-resize; }
  .resize-nw { top: -3px;    left: -3px;   width: 12px;  height: 12px; cursor: nw-resize; }
  .resize-se { bottom: -3px; right: -3px;  width: 12px;  height: 12px; cursor: se-resize; }
  .resize-sw { bottom: -3px; left: -3px;   width: 12px;  height: 12px; cursor: sw-resize; }

  :host(.maximized) .resize-handle,
  :host([mode="mobile"]) .resize-handle {
    display: none;
  }
`;
