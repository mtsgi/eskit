import { html } from "system/util.js";
export default html`
  <div class="dialog" part="dialog" role="dialog" aria-modal="true" aria-labelledby="perm-title">
    <h3 class="title kit-flex kit-items-center kit-gap-xs" id="perm-title">
      <eskit-icon set="lucide" name="shield" size="18"></eskit-icon>
      <span>アクセス許可の要求</span>
    </h3>
    <p class="description" id="perm-desc"></p>
    <code class="perm-badge" id="perm-badge"></code>
    <div class="actions">
      <button class="btn btn-deny kit-button"  id="btn-deny">拒否</button>
      <button class="btn btn-allow kit-button -primary" id="btn-allow">許可</button>
    </div>
  </div>
`;
