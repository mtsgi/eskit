import { css } from "system/util.js";

export default css`
  :host {
    position: fixed;
    inset: 0;
    z-index: 100000;
    display: none;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(12px) saturate(140%);
    -webkit-backdrop-filter: blur(12px) saturate(140%);
  }

  :host([open]) {
    display: flex;
  }

  .login-shell {
    width: min(88vw, 300px);
    border: 1px solid color-mix(in srgb, var(--eskit-color-border, #444) 60%, transparent);
    border-radius: var(--kit-radius-m, 10px);
    padding: var(--kit-space-m, 14px);
    background: color-mix(in srgb, var(--eskit-color-background, #1e1e24) 88%, transparent);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .login-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .brand-icon {
    color: var(--kit-color-primary, #6366f1);
  }

  .title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--eskit-color-text, inherit);
  }

  .lang-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 2px 7px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.04em;
    border: 1px solid color-mix(in srgb, var(--eskit-color-border, #444) 50%, transparent);
    border-radius: var(--kit-radius-xs, 4px);
    background: color-mix(in srgb, var(--eskit-color-surface, #2a2a32) 40%, transparent);
    color: var(--eskit-color-text-secondary, var(--kit-fg-secondary));
    transition: all 0.15s ease;
  }

  .lang-toggle:hover {
    color: var(--eskit-color-text, #fff);
    border-color: var(--eskit-color-primary, #6366f1);
    background: color-mix(in srgb, var(--eskit-color-surface, #2a2a32) 80%, transparent);
  }

  .subtitle {
    margin: 0 0 10px;
    color: var(--eskit-color-text-secondary, var(--kit-fg-muted));
    font-size: 11px;
    line-height: 1.3;
    opacity: 0.85;
  }

  .form {
    display: grid;
    gap: 8px;
  }

  .field {
    display: grid;
    gap: 3px;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    color: var(--eskit-color-text-secondary, var(--kit-fg-secondary));
  }

  .input {
    height: 30px;
    border: 1px solid var(--eskit-color-border, #3a3a44);
    border-radius: var(--kit-radius-s, 6px);
    background: color-mix(in srgb, var(--eskit-color-surface, #141418) 70%, transparent);
    color: var(--eskit-color-text, inherit);
    padding: 0 8px;
    font-size: 12.5px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .input:focus {
    border-color: var(--eskit-color-primary, #6366f1);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--eskit-color-primary, #6366f1) 25%, transparent);
  }

  .error {
    margin: 0;
    color: var(--kit-color-danger, #ef4444);
    font-size: 11px;
    line-height: 1.3;
  }

  .error:empty {
    display: none;
  }

  .actions {
    display: flex;
    margin-top: 4px;
  }

  .submit-btn {
    width: 100%;
    height: 30px;
    padding: 0 10px;
    font-size: 12px;
    font-weight: 500;
    justify-content: center;
    border-radius: var(--kit-radius-s, 6px);
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;