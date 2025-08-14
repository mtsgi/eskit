import App from "system/app.js";

export default class WelcomeApp extends App {
  constructor() {
    super();
    this.name = "WelcomeApp";
    this.template = `
      <div>
        <strong>Welcome to ESKit</strong>
        <div>This is a simple welcome application.</div>
      </div>
    `;
    this.style = `
      strong {
        text-decoration: underline;
      }
    `;
  }
}
