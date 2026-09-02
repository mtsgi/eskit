import { css } from "system/util.js";

export default css`
  :host {
    display: flex;
    width: 100%;
    height: 100%;
    background: var(--eskit-color-surface, var(--kit-bg, #1e1e2e));
    color: var(--eskit-color-text, var(--kit-fg, #e0e0e0));
    overflow: hidden;
    font-family: var(--kit-font-family);
  }

  .settings-layout {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  /* ─── 左サイドバー ────────────────────────────────────────── */

  .sidebar {
    width: 200px;
    flex-shrink: 0;
    background: var(--kit-bg-secondary, rgba(0, 0, 0, 0.15));
    border-right: 1px solid var(--eskit-color-border, var(--kit-border-color, #404060));
    display: flex;
    flex-direction: column;
    padding: var(--kit-space-m, 12px) var(--kit-space-s, 8px);
    gap: 4px;
    overflow-y: auto;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: var(--kit-space-s, 8px);
    padding: 8px 12px;
    border-radius: var(--kit-radius-s, 6px);
    border: none;
    background: transparent;
    color: var(--eskit-color-text, var(--kit-fg, #e0e0e0));
    font-size: var(--kit-font-size-s, 0.875rem);
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease, color 0.15s ease;
    user-select: none;
    width: 100%;
  }

  .nav-btn:hover {
    background: var(--kit-bg-tertiary, rgba(255, 255, 255, 0.08));
  }

  .nav-btn.-active {
    background: var(--eskit-color-primary, var(--kit-color-primary, #1e8fff));
    color: var(--eskit-color-on-primary, #ffffff);
    font-weight: 600;
  }

  .nav-btn.-active eskit-icon {
    color: currentColor;
  }

  /* ─── メインコンテンツ領域 ────────────────────────────────── */

  .content-pane {
    flex: 1;
    overflow-y: auto;
    padding: var(--kit-space-l, 20px) var(--kit-space-xl, 28px);
  }

  .tab-pane {
    display: flex;
    flex-direction: column;
    gap: var(--kit-space-l, 20px);
  }

  .page-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: var(--kit-space-s, 8px);
  }

  .page-title {
    font-size: var(--kit-font-size-xl, 1.4rem);
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--kit-space-s, 8px);
  }

  .page-desc {
    font-size: var(--kit-font-size-s, 0.875rem);
    color: var(--eskit-color-text-muted, var(--kit-fg-secondary, #a0a0b0));
    margin: 0;
  }

  /* ─── セクション & カード ─────────────────────────────────── */

  .card {
    background: var(--kit-bg-secondary, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--eskit-color-border, var(--kit-border-color, #404060));
    border-radius: var(--kit-radius-m, 8px);
    padding: var(--kit-space-l, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--kit-space-m, 12px);
  }

  .card-title {
    font-size: var(--kit-font-size-m, 1rem);
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--kit-space-xs, 6px);
  }

  .card-desc {
    font-size: var(--kit-font-size-xs, 0.75rem);
    color: var(--eskit-color-text-muted, var(--kit-fg-secondary, #a0a0b0));
    margin: -6px 0 4px;
  }

  /* ─── カラーモード切替グリッド ────────────────────────────── */

  .mode-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--kit-space-s, 8px);
  }

  .mode-card {
    border: 1px solid var(--eskit-color-border, var(--kit-border-color, #404060));
    border-radius: var(--kit-radius-s, 6px);
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    background: var(--kit-bg, rgba(0, 0, 0, 0.2));
    transition: border-color 0.15s, background 0.15s;
    user-select: none;
  }

  .mode-card:hover {
    border-color: var(--eskit-color-primary, #1e8fff);
  }

  .mode-card.-active {
    border-color: var(--eskit-color-primary, #1e8fff);
    background: color-mix(in srgb, var(--eskit-color-primary, #1e8fff) 15%, transparent);
    font-weight: 600;
  }

  /* ─── テーマプリセットグリッド ────────────────────────────── */

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: var(--kit-space-m, 12px);
  }

  .theme-card {
    border: 1px solid var(--eskit-color-border, var(--kit-border-color, #404060));
    border-radius: var(--kit-radius-m, 8px);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    cursor: pointer;
    background: var(--kit-bg, rgba(0, 0, 0, 0.2));
    transition: border-color 0.15s ease, background 0.15s ease;
    user-select: none;
  }

  .theme-card:hover {
    border-color: var(--eskit-color-primary, #1e8fff);
  }

  .theme-card.-active {
    border-color: var(--eskit-color-primary, #1e8fff);
    box-shadow: 0 0 0 2px var(--eskit-color-primary, #1e8fff);
    background: color-mix(in srgb, var(--eskit-color-primary, #1e8fff) 10%, var(--kit-bg, rgba(0, 0, 0, 0.2)));
  }

  .theme-palette-preview {
    display: flex;
    height: 28px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--kit-border-color, rgba(255, 255, 255, 0.15));
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
  }

  .palette-swatch {
    flex: 1;
    height: 100%;
    border-right: 1px solid rgba(0, 0, 0, 0.08);
  }

  .palette-swatch:last-child {
    border-right: none;
  }

  .theme-name {
    font-size: var(--kit-font-size-s, 0.875rem);
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ─── 壁紙グリッド ────────────────────────────────────────── */

  .wallpaper-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--kit-space-s, 8px);
  }

  .wallpaper-card {
    aspect-ratio: 16 / 9;
    min-height: 80px;
    border-radius: var(--kit-radius-m, 8px);
    border: 2px solid transparent;
    cursor: pointer;
    background-size: cover;
    background-position: center;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .wallpaper-card:hover {
    border-color: var(--eskit-color-primary, #1e8fff);
  }

  .wallpaper-card.-active {
    border-color: var(--eskit-color-primary, #1e8fff);
    box-shadow: 0 0 0 2px var(--eskit-color-primary, #1e8fff), 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .wallpaper-label {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    color: #ffffff;
    font-size: var(--kit-font-size-xs, 11px);
    font-weight: 500;
    padding: 3px 6px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ─── テーブル & リスト ──────────────────────────────────── */

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--kit-font-size-s, 0.875rem);
  }

  .data-table th, .data-table td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid var(--kit-border-color-light, rgba(255, 255, 255, 0.08));
  }

  .data-table th {
    color: var(--eskit-color-text-muted, var(--kit-fg-secondary, #a0a0b0));
    font-weight: 600;
  }

  .empty-state {
    padding: var(--kit-space-xl, 24px);
    text-align: center;
    color: var(--eskit-color-text-muted, var(--kit-fg-secondary, #a0a0b0));
    font-size: var(--kit-font-size-s, 0.875rem);
  }

  /* ─── 権限管理リスト ──────────────────────────────────────── */

  .perm-app-section {
    background: var(--kit-bg-secondary, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--eskit-color-border, var(--kit-border-color, #404060));
    border-radius: var(--kit-radius-m, 8px);
    padding: var(--kit-space-m, 12px) var(--kit-space-l, 16px);
    margin-bottom: var(--kit-space-m, 12px);
  }

  .perm-app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--kit-space-s, 8px);
    border-bottom: 1px solid var(--kit-border-color-light, rgba(255, 255, 255, 0.08));
    margin-bottom: var(--kit-space-s, 8px);
  }

  .perm-app-info {
    display: flex;
    align-items: center;
    gap: var(--kit-space-s, 8px);
  }

  .perm-app-name {
    font-weight: 600;
    font-size: var(--kit-font-size-m, 1rem);
  }

  .perm-app-id {
    font-size: var(--kit-font-size-xs, 0.75rem);
    color: var(--eskit-color-text-muted, var(--kit-fg-secondary, #a0a0b0));
  }

  .perm-list {
    display: flex;
    flex-direction: column;
    gap: var(--kit-space-xs, 6px);
  }

  .perm-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--kit-space-xs, 6px) var(--kit-space-s, 8px);
    border-radius: var(--kit-radius-s, 6px);
    background: var(--kit-bg-tertiary, rgba(255, 255, 255, 0.03));
    gap: var(--kit-space-m, 12px);
  }

  .perm-item:hover {
    background: var(--kit-bg, rgba(255, 255, 255, 0.06));
  }

  .perm-item-details {
    display: flex;
    align-items: center;
    gap: var(--kit-space-s, 8px);
    flex: 1;
    min-width: 0;
  }

  .perm-desc-text {
    font-size: var(--kit-font-size-xs, 0.8rem);
    color: var(--eskit-color-text-muted, var(--kit-fg-secondary, #a0a0b0));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .perm-actions {
    display: flex;
    align-items: center;
    gap: var(--kit-space-s, 8px);
    flex-shrink: 0;
  }

  /* ─── レスポンシブ ────────────────────────────────────────── */

  @media (max-width: 600px) {
    .settings-layout {
      flex-direction: column;
    }
    .sidebar {
      width: 100%;
      flex-direction: row;
      border-right: none;
      border-bottom: 1px solid var(--eskit-color-border, var(--kit-border-color, #404060));
      overflow-x: auto;
      padding: 8px;
    }
    .nav-btn {
      width: auto;
      white-space: nowrap;
    }
    .content-pane {
      padding: 16px;
    }
    .mode-selector {
      grid-template-columns: 1fr;
    }
  }
`;
