import { css } from "system/util.js";

export default css`
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--kit-bg);
    color: var(--kit-fg);
    overflow: hidden;
    font-family: var(--kit-font-family, system-ui, sans-serif);
    font-size: 0.875rem;
  }

  .fm-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  /* ─── ツールバー & パスバー ─── */
  .fm-toolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--kit-bg-secondary);
    border-bottom: 1px solid var(--kit-border);
    flex-shrink: 0;
  }

  .fm-toolbar-separator {
    width: 1px;
    height: 16px;
    background: var(--kit-border);
    margin: 0 4px;
  }

  .path-bar-container {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 80px;
    background: var(--kit-bg);
    border: 1px solid var(--kit-border);
    border-radius: var(--kit-radius, 4px);
    padding: 2px 6px;
    gap: 4px;
  }

  .path-input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: var(--kit-fg);
    font-size: 0.8125rem;
    font-family: var(--kit-font-family-mono, monospace);
  }

  /* ─── メインレイアウト (サイドバー + グリッド) ─── */
  .fm-body {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .fm-sidebar {
    width: 130px;
    background: var(--kit-bg-secondary);
    border-right: 1px solid var(--kit-border);
    padding: 6px 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex-shrink: 0;
    overflow-y: auto;
  }

  .sidebar-section-title {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--kit-fg-muted);
    padding: 4px 8px 2px 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: var(--kit-radius, 4px);
    color: var(--kit-fg);
    font-size: 0.8125rem;
    cursor: pointer;
    background: transparent;
    border: none;
    text-align: left;
    outline: none;
  }

  .sidebar-link:hover {
    background: var(--kit-bg-tertiary, rgba(255, 255, 255, 0.06));
  }

  .sidebar-link.-active {
    background: var(--kit-bg-tertiary, rgba(255, 255, 255, 0.1));
    color: var(--kit-color-primary);
    font-weight: 600;
  }

  /* ─── ファイル表示エリア ─── */
  .fm-content {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    padding: 8px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
    grid-gap: 6px;
    align-content: flex-start;
  }

  .file-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 4px 6px 4px;
    border-radius: var(--kit-radius, 4px);
    border: 1px solid transparent;
    cursor: pointer;
    user-select: none;
    text-align: center;
    background: transparent;
  }

  .file-item:hover {
    background: var(--kit-bg-secondary);
  }

  .file-item.-selected {
    background: var(--kit-bg-secondary);
    border-color: var(--kit-color-primary);
  }

  .file-item-icon {
    margin-bottom: 4px;
  }

  .file-item-name {
    font-size: 0.75rem;
    color: var(--kit-fg);
    word-break: break-all;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.2;
    max-width: 100%;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: var(--kit-fg-muted);
    font-size: 0.8125rem;
    gap: 8px;
    padding: 32px 0;
  }

  /* ─── ステータスバー ─── */
  .fm-status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 10px;
    background: var(--kit-bg-secondary);
    border-top: 1px solid var(--kit-border);
    font-size: 0.75rem;
    color: var(--kit-fg-muted);
    flex-shrink: 0;
  }

  /* ─── レスポンシブ (Container Query & Media Query) ─── */
  @container (max-width: 520px) {
    .fm-body {
      flex-direction: column;
    }
    .fm-sidebar {
      width: 100%;
      flex-direction: row;
      border-right: none;
      border-bottom: 1px solid var(--kit-border);
      overflow-x: auto;
      padding: 4px 6px;
      gap: 4px;
    }
    .sidebar-section-title {
      display: none;
    }
    .sidebar-link {
      white-space: nowrap;
      flex-shrink: 0;
      padding: 4px 8px;
    }
    .fm-toolbar button span {
      display: none;
    }
    .file-grid {
      grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    }
  }

  @media (max-width: 520px) {
    .fm-body {
      flex-direction: column;
    }
    .fm-sidebar {
      width: 100%;
      flex-direction: row;
      border-right: none;
      border-bottom: 1px solid var(--kit-border);
      overflow-x: auto;
      padding: 4px 6px;
      gap: 4px;
    }
    .sidebar-section-title {
      display: none;
    }
    .sidebar-link {
      white-space: nowrap;
      flex-shrink: 0;
      padding: 4px 8px;
    }
    .fm-toolbar button span {
      display: none;
    }
    .file-grid {
      grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    }
  }
`;
