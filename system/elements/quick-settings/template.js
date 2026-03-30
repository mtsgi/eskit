import { html } from "system/util.js";
export default html`
  <div class="quick-settings" popover="manual" id="panel">
    <div class="qs-header">
      <span class="kit-font-s kit-font-bold">クイック設定</span>
    </div>

    <div class="qs-section">
      <div class="qs-row">
        <span class="qs-label">シェルモード</span>
        <div class="kit-buttongroup" id="mode-group">
          <button class="kit-button -small mode-btn" data-mode="auto">Auto</button>
          <button class="kit-button -small mode-btn" data-mode="desktop">Desktop</button>
          <button class="kit-button -small mode-btn" data-mode="mobile">Mobile</button>
        </div>
      </div>
    </div>

    <hr class="qs-divider">

    <div class="qs-section">
      <div class="qs-row">
        <span class="qs-label">テーマ</span>
        <span class="qs-value kit-c-fg-secondary kit-font-s">Phase 4</span>
      </div>
      <div class="qs-row">
        <span class="qs-label">言語</span>
        <span class="qs-value kit-c-fg-secondary kit-font-s">Phase 4</span>
      </div>
    </div>

    <hr class="qs-divider">

    <div class="qs-section">
      <div class="qs-row">
        <span class="qs-label">実行中プロセス</span>
        <span class="qs-value kit-badge -primary" id="process-count">0</span>
      </div>
    </div>
  </div>
`;
