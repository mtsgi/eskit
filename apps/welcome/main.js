import ESKitApp from "system/app.js";

import style from "./style.js";
import template from "./template.js";

export default class WelcomeApp extends ESKitApp {
  constructor() {
    super();
    this.name = "WelcomeApp";
    this.template = template;
    this.style = style;
  }
}
