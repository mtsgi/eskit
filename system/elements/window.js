export default class ESKitWindowElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border: 1px solid #ccc;
        }
        .header {
          background: #f0f0f0;
          border-bottom: 1px solid #ccc;
        }
        .content {
        }
      </style>
      <div class="header">
        App
      </div>
      <div class="content">
        <slot></slot>
      </div>
    `;
  }
}
