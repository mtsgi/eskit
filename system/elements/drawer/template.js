import { html } from "system/util.js";
export default html`
  <div class="drawer-panel" part="panel">
    <div class="drawer-handle"></div>
    <div class="drawer-topbar">
      <span class="drawer-time" id="drawer-time"></span>
      <button class="qs-open-btn" id="qs-btn" title="クイック設定">
        <span>⚙️</span>
        <span class="qs-open-label">設定</span>
      </button>
      <button class="qs-open-btn" id="beacon-btn" title="検索">
        <span>🔍</span>
        <span class="qs-open-label">検索</span>
      </button>
    </div>
    <section class="section">
      <div class="section-header">実行中のアプリ</div>
      <div class="app-list" id="running-list"></div>
    </section>
    <section class="section">
      <div class="section-header">すべてのアプリ</div>
      <div class="app-grid" id="all-apps-grid"></div>
    </section>
  </div>
`;
