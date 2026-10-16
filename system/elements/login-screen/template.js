import hamon from "system/hamon.js";

export default (scope) => hamon`
  <div class="login-shell" role="dialog" aria-modal="true" aria-labelledby="login-title">
    <h2 class="title" id="login-title">${() => window.System?.i18n?.t("login.title") || "ESKit Login"}</h2>
    <p class="subtitle" id="subtitle"></p>

    <form id="form" class="form" autocomplete="off" novalidate>
      <div class="field" id="field-login-user">
        <label for="login-user-id" class="kit-flex kit-flex-middle kit-gap-xs">
          <eskit-icon set="lucide" name="user" size="14"></eskit-icon>
          <span>${() => window.System?.i18n?.t("login.user") || "ユーザー"}</span>
        </label>
        <select id="login-user-id"></select>
      </div>

      <div class="field">
        <label for="password" class="kit-flex kit-flex-middle kit-gap-xs">
          <eskit-icon set="lucide" name="lock" size="14"></eskit-icon>
          <span>${() => window.System?.i18n?.t("login.password") || "パスワード"}</span>
        </label>
        <input id="password" type="password">
      </div>

      <p id="error" class="error" role="alert"></p>

      <div class="actions">
        <button id="submit" class="kit-button -primary" type="submit"></button>
      </div>
    </form>
  </div>
`;
