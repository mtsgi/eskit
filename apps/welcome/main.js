import ESKitApp from "system/app.js";
import style from "./style.js";
import createTemplate from "./template.js";

export default class WelcomeApp extends ESKitApp {
  static style = style;

  constructor() {
    super();
    this.name = "WelcomeApp";
    this.template = createTemplate(this);
  }

  initialize() {
    this.setTitle(this.t("apps.welcome.name"));
    this.hamon.effect(() => {
      this.setTitle(this.t("apps.welcome.name"));
    });
  }
}
