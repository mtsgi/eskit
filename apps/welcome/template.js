import hamon from "system/hamon.js";

export default (app) => hamon`
  <div class="welcome-wrap">
    <div class="welcome-header">
      <eskit-icon set="lucide" name="sparkles" size="24"></eskit-icon>
      <h2 class="welcome-title">${() => app.t("apps.welcome.title")}</h2>
    </div>
    <p class="welcome-desc">${() => app.t("apps.welcome.subtitle")}</p>
  </div>
`;

