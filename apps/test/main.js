import ESKitApp from "system/app.js";

import style from "./style.js";
import template from "./template.js";

export default class TestApp extends ESKitApp {
  constructor() {
    super();
    this.name = "TestApp";
    this.template = template;
    this.style = style;
  }
}
