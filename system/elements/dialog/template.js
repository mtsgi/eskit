import { html } from "system/util.js";

export default html`
  <div class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
    <div class="header">
      <div id="header-icon" class="header-icon">
        <eskit-icon id="icon-el" set="lucide" name="info" size="20"></eskit-icon>
      </div>
      <h3 id="dialog-title" class="title">確認</h3>
    </div>

    <div class="body">
      <div id="dialog-message" class="message"></div>
      <div id="prompt-container" class="prompt-field kit-hidden">
        <input id="prompt-input" class="kit-textbox prompt-input" type="text" autocomplete="off">
      </div>
      <div id="custom-container" class="custom-content kit-hidden"></div>
    </div>

    <div id="actions-container" class="actions"></div>
  </div>
`;
