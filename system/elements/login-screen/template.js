import hamon from "system/hamon.js";

export default (scope) => hamon`
  <div class="login-shell" role="dialog" aria-modal="true" aria-labelledby="login-title">
    <div class="login-header">
      <div class="brand">
        <eskit-icon set="lucide" name="sparkles" size="15" class="brand-icon"></eskit-icon>
        <h2 class="title" id="login-title">${() => window.System?.i18n?.t("login.title") || "ESKit ログイン"}</h2>
      </div>
      <button type="button" class="lang-toggle" @click=${() => scope.toggleLanguage()} title="Switch Language / 言語切替">
        <eskit-icon set="lucide" name="globe" size="11"></eskit-icon>
        <span>${() => (window.System?.i18n?.locale?.value || "ja").toUpperCase()}</span>
      </button>
    </div>

    <p class="subtitle" id="subtitle">${() => scope.subtitle.value}</p>

    <form id="form" class="form" autocomplete="off" novalidate @submit=${(e) => scope.handleSubmit(e)}>
      <div class="field" id="field-login-user">
        <label for="login-user-id" class="field-label">
          <eskit-icon set="lucide" name="user" size="11"></eskit-icon>
          <span>${() => window.System?.i18n?.t("login.user") || "ユーザー"}</span>
        </label>
        <select id="login-user-id" class="input"></select>
      </div>

      <div class="field">
        <label for="password" class="field-label">
          <eskit-icon set="lucide" name="lock" size="11"></eskit-icon>
          <span>${() => window.System?.i18n?.t("login.password") || "パスワード"}</span>
        </label>
        <input id="password" class="input" type="password" placeholder="••••••••">
      </div>

      <p id="error" class="error" role="alert">${() => scope.errorMessage.value}</p>

      <div class="actions">
        <button id="submit" class="submit-btn kit-button -primary -small" type="submit">
          <span>${() => scope.submitLabel.value}</span>
          <eskit-icon set="lucide" name="arrow-right" size="12"></eskit-icon>
        </button>
      </div>
    </form>
  </div>
`;
