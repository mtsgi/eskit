import ESKitSystem from "./system/system.js";

const system = new ESKitSystem();

// ブート完了後にビルトインアプリを起動する
system.events.once("system:ready", () => {
  system.loadApp("apps/test/");
  system.loadApp("apps/welcome/");
});

