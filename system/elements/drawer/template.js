import { html } from "system/util.js";
export default html`
  <div class="drawer-panel" part="panel">
    <div class="drawer-handle"></div>
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
