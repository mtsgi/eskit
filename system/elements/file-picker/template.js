import { html } from "system/util.js";

export default html`
  <div class="fp-dialog-card" role="dialog" aria-modal="true" aria-labelledby="fp-title">
    <div class="fp-header">
      <div class="fp-header-icon">
        <eskit-icon set="lucide" name="folder-open" size="20"></eskit-icon>
      </div>
      <h3 id="fp-title" class="fp-title">ファイルを選択</h3>
      <button id="fp-close-btn" class="kit-button -small -icon" type="button" aria-label="閉じる">
        <eskit-icon set="lucide" name="x" size="16"></eskit-icon>
      </button>
    </div>

    <div class="fp-nav">
      <button id="fp-up-btn" class="kit-button -small" type="button" title="上の階層へ">
        <eskit-icon set="lucide" name="arrow-up" size="14"></eskit-icon>
      </button>
      <div class="fp-path-bar">
        <eskit-icon set="lucide" name="folder" size="14" class="fp-path-icon"></eskit-icon>
        <span id="fp-current-path" class="fp-path-text">/home</span>
      </div>
    </div>

    <div class="fp-body">
      <div id="fp-file-grid" class="fp-file-grid" role="listbox"></div>
      <div id="fp-empty-msg" class="fp-empty-msg kit-hidden">ファイルがありません</div>
    </div>

    <div class="fp-footer">
      <div class="fp-selection-row">
        <span id="fp-file-label" class="fp-label">ファイル名:</span>
        <input id="fp-file-name-input" class="kit-textbox fp-input" type="text" readonly placeholder="">
      </div>
      <div class="fp-actions">
        <button id="fp-cancel-btn" class="kit-button" type="button">キャンセル</button>
        <button id="fp-open-btn" class="kit-button -primary" type="button" disabled>開く</button>
      </div>
    </div>
  </div>
`;
