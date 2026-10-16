import ESKitApp from "system/app.js";
import style from "./style.js";
import createTemplate from "./template.js";

export default class WelcomeApp extends ESKitApp {
  static style = style;

  constructor() {
    super();
    this.template = createTemplate(this);
  }
}
