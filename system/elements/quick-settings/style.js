import { css } from "system/util.js";

export default css`
  :host {
    display: contents;
  }

  .quick-settings {
    position: fixed;
    margin: 0;
    padding: 0;
    inset: unset;
    bottom: calc(var(--eskit-taskbar-height, 48px) + var(--kit-space-s));
    right: var(--kit-space-s);
    width: 280px;
    background: var(--eskit-color-surface, var(--eskit-color-background));
    color: var(--eskit-color-text, var(--kit-fg));
    border: 1px solid var(--eskit-color-border);
    border-radius: var(--kit-radius-m);
    box-shadow: var(--kit-shadow-8);
    z-index: 15000;
    overflow: hidden;
    /* ─── 開閉アニメーション ────────────────────────────── */
    opacity: 1;
    transform: translateY(0) scale(1);
    transition:
      opacity var(--kit-transition-normal) ease,
      transform var(--kit-transition-normal) ease,
      display var(--kit-transition-normal) allow-discrete,
      overlay var(--kit-transition-normal) allow-discrete;
  }

  @starting-style {
    .quick-settings:popover-open {
      opacity: 0;
      transform: translateY(6px) scale(0.97);
    }
  }

  .quick-settings:not(:popover-open) {
    opacity: 0;
    transform: translateY(6px) scale(0.97);
  }

  @media (prefers-reduced-motion: reduce) {
    .quick-settings {
      transition: none;
    }
  }

  .qs-header {
    padding: var(--kit-space-s) var(--kit-space-m);
    border-bottom: 1px solid var(--eskit-color-border);
  }

  .qs-header-title {
    display: inline-flex;
    align-items: center;
    gap: var(--kit-space-xs);
    font-size: var(--kit-font-size-s);
    font-weight: var(--kit-font-weight-bold);
    line-height: 1;
    color: var(--eskit-color-text, var(--kit-fg));
  }

  .qs-section {
    padding: var(--kit-space-s) var(--kit-space-m);
    display: flex;
    flex-direction: column;
    gap: var(--kit-space-s);
  }

  .qs-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--kit-space-s);
  }

  .qs-label {
    display: inline-flex;
    align-items: center;
    gap: var(--kit-space-xs);
    font-size: var(--kit-font-size-s);
    line-height: 1;
    color: var(--eskit-color-text, var(--kit-fg));
    flex-shrink: 0;
  }

  .qs-value {
    font-size: var(--kit-font-size-s);
    line-height: 1.2;
    text-align: right;
    color: var(--eskit-color-text, var(--kit-fg));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .qs-value.-muted {
    color: var(--eskit-color-text-muted, var(--kit-fg-secondary));
  }

  .logout-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--kit-space-xs);
    line-height: 1;
    width: 100%;
  }

  .qs-divider {
    border: none;
    border-top: 1px solid var(--eskit-color-border);
    margin: 0;
  }

  /* ─── モード切替ボタン ─────────────────────────────────── */

  .mode-btn {
    line-height: 1;
  }

  .mode-btn.-active {
    background: var(--eskit-color-primary);
    border-color: var(--eskit-color-primary);
    color: var(--eskit-color-on-primary, #fff);
    box-shadow: none;
  }

  /* ─── モバイルモード: 全幅・画面上部スライドダウン ──────── */

  .quick-settings.-mobile {
    top: 0;
    left: 0;
    right: 0;
    bottom: unset;
    width: 100%;
    border-radius: 0 0 var(--kit-radius-l) var(--kit-radius-l);
    border-top: none;
    /* モバイル用アニメーション (上からスライドダウン) */
    transform: translateY(0);
  }

  @starting-style {
    .quick-settings.-mobile:popover-open {
      opacity: 0;
      transform: translateY(-100%);
    }
  }

  .quick-settings.-mobile:not(:popover-open) {
    opacity: 0;
    transform: translateY(-100%);
  }
`;
