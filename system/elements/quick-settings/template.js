import { html } from "system/util.js";
export default html`
  <div class="quick-settings" popover="manual" id="panel">
    <div class="qs-header">
      <span class="qs-header-title">
        <eskit-icon set="lucide" name="sliders" size="14"></eskit-icon>
        <span>クイック設定</span>
      </span>
    </div>

    <div class="qs-section">
      <div class="qs-row">
        <span class="qs-label">
          <eskit-icon set="lucide" name="user" size="14"></eskit-icon>
          <span>ユーザー</span>
        </span>
        <span class="qs-value" id="current-user">(未ログイン)</span>
      </div>
      <div class="qs-row">
        <button class="kit-button -small logout-btn" id="logout-btn">
          <eskit-icon set="lucide" name="power" size="14"></eskit-icon>
          <span>ログアウト</span>
        </button>
      </div>
    </div>

    <hr class="qs-divider">

    <div class="qs-section">
      <div class="qs-row">
        <span class="qs-label">
          <eskit-icon set="lucide" name="monitor-smartphone" size="14"></eskit-icon>
          <span>シェルモード</span>
        </span>
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
        <span class="qs-label">
          <eskit-icon set="lucide" name="palette" size="14"></eskit-icon>
          <span>テーマ</span>
        </span>
        <span class="qs-value -muted">Phase 5</span>
      </div>
      <div class="qs-row">
        <span class="qs-label">
          <eskit-icon set="lucide" name="globe" size="14"></eskit-icon>
          <span>言語</span>
        </span>
        <span class="qs-value -muted">Phase 5</span>
      </div>
    </div>

    <hr class="qs-divider">

    <div class="qs-section">
      <div class="qs-row">
        <span class="qs-label">
          <eskit-icon set="lucide" name="cpu" size="14"></eskit-icon>
          <span>実行中プロセス</span>
        </span>
        <span class="qs-value kit-badge -primary" id="process-count">0</span>
      </div>
    </div>
  </div>
`;
