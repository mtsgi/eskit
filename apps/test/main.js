import App from "system/app.js";

export default class TestApp extends App {
  constructor() {
    super();
    this.name = "TestApp";
    this.template = `
      <div>
        <strong>Test Application</strong>
        <div>This is a simple test application.</div>
      </div>
    `;
    this.style = `
      strong {
        color: green;
      }
    `;
  }
}
