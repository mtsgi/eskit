import { css } from "system/util.js";

export default css`
  :host {
    position: fixed;
    inset: 0;
    z-index: 100000;
    display: none;
    align-items: center;
    justify-content: center;
  }

  :host([open]) {
    display: flex;
  }

  .login-shell {
    width: min(92vw, 420px);
    border: 1px solid var(--eskit-color-border);
    border-radius: var(--kit-radius-l);
    padding: var(--kit-space-xl);
    background: color-mix(in srgb, var(--eskit-color-background) 92%, transparent);
    box-shadow: 0 24px 56px rgba(0, 0, 0, 0.28);
  }

  .title {
    margin: 0 0 var(--kit-space-xs);
    font-size: 1.2rem;
    letter-spacing: 0.02em;
  }

  .subtitle {
    margin: 0 0 var(--kit-space-l);
    color: var(--eskit-color-text-secondary, var(--kit-fg-secondary));
    font-size: var(--kit-font-size-s);
  }

  .form {
    display: grid;
    gap: var(--kit-space-m);
  }

  .field {
    display: grid;
    gap: var(--kit-space-2xs);
  }

  .field > label {
    font-size: var(--kit-font-size-s);
    color: var(--kit-fg-secondary);
  }

  .field > input,
  .field > select {
    height: 2.2rem;
    border: 1px solid var(--eskit-color-border);
    border-radius: var(--kit-radius-s);
    background: var(--eskit-color-background);
    color: var(--eskit-color-text);
    padding: 0 var(--kit-space-s);
    font: inherit;
  }

  .error {
    min-height: 1.2em;
    margin: 0;
    color: var(--kit-color-danger);
    font-size: var(--kit-font-size-xs);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }

  :host([mode="login"]) #field-create-id,
  :host([mode="login"]) #field-create-name,
  :host([mode="login"]) #field-password-confirm {
    display: none;
  }

  :host([mode="setup"]) #field-login-user {
    display: none;
  }
`;