import { html } from "system/util.js";
export default html`
  <div class="resize-handle resize-n"></div>
  <div class="resize-handle resize-s"></div>
  <div class="resize-handle resize-e"></div>
  <div class="resize-handle resize-w"></div>
  <div class="resize-handle resize-ne"></div>
  <div class="resize-handle resize-nw"></div>
  <div class="resize-handle resize-se"></div>
  <div class="resize-handle resize-sw"></div>
  <div class="app-header">
    <span class="app-icon" id="window-icon"></span>
    <span class="app-title"></span>
    <div class="app-controls">
      <button class="btn-minimize" title="最小化"><eskit-icon set="lucide" name="minus" size="14"></eskit-icon></button>
      <button class="btn-maximize" title="最大化"><eskit-icon set="lucide" name="square" size="12"></eskit-icon></button>
      <button class="btn-close" title="閉じる"><eskit-icon set="lucide" name="x" size="14"></eskit-icon></button>
    </div>
  </div>
`;
