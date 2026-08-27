/**
 * ESKitManifest — アプリマニフェスト (`define.json`) のロードとバリデーション
 *
 * Manifest 型:
 *   { id, name, entry, icon, version, description, permissions[] }
 */
export default class ESKitManifest {
  static #REQUIRED = ["id", "name", "entry"];

  static #VALID_PERMISSIONS = new Set([
    "fs.read",
    "fs.write",
    "fs.read.all",
    "fs.write.all",
    "fs.shared",
    "notifications",
    "ipc",
    "network",
    "system.info",
    "clipboard",
    "user.info",
    "user.manage",
  ]);

  /**
   * アプリディレクトリから define.json を fetch してバリデーション済みの Manifest を返す。
   * @param {string} appDir  末尾スラッシュ付きのパス (例: "apps/myapp/")
   * @returns {Promise<Manifest>}
   */
  static async load(appDir) {
    const dir = appDir.endsWith("/") ? appDir : appDir + "/";
    const res = await fetch(dir + "define.json");
    if (!res.ok) {
      throw new Error(`[ESKitManifest] Failed to fetch ${dir}define.json: HTTP ${res.status}`);
    }
    const obj = await res.json();
    return ESKitManifest.validate(obj, dir);
  }

  /**
   * パースされたオブジェクトをバリデーションし、正規化した Manifest を返す。
   * @param {object} obj
   * @param {string} appDir  エラーメッセージ用のパス
   * @returns {Manifest}
   */
  static validate(obj, appDir = "(unknown)") {
    for (const key of ESKitManifest.#REQUIRED) {
      if (!obj[key]) {
        throw new Error(`[ESKitManifest] define.json is missing required field "${key}" (in ${appDir})`);
      }
    }

    const permissions = Array.isArray(obj.permissions) ? obj.permissions : [];
    const unknownPerms = permissions.filter((p) => !ESKitManifest.#VALID_PERMISSIONS.has(p));
    if (unknownPerms.length > 0) {
      console.warn(`[ESKitManifest] Unknown permissions in ${appDir}: ${unknownPerms.join(", ")}`);
    }

    let normalizedIcon = null;
    if (obj.icon !== undefined && obj.icon !== null) {
      if (typeof obj.icon !== "object" || Array.isArray(obj.icon)) {
        throw new Error(`[ESKitManifest] "icon" must be an object ({ type: "set" | "image", ... }) in ${appDir}`);
      }
      if (obj.icon.type === "set") {
        if (!obj.icon.name || typeof obj.icon.name !== "string") {
          throw new Error(`[ESKitManifest] icon of type "set" requires a "name" string in ${appDir}`);
        }
        normalizedIcon = {
          type: "set",
          set: typeof obj.icon.set === "string" ? obj.icon.set : "lucide",
          name: obj.icon.name,
        };
      } else if (obj.icon.type === "image") {
        if (!obj.icon.src || typeof obj.icon.src !== "string") {
          throw new Error(`[ESKitManifest] icon of type "image" requires a "src" string in ${appDir}`);
        }
        normalizedIcon = {
          type: "image",
          src: obj.icon.src,
        };
      } else {
        throw new Error(`[ESKitManifest] Invalid icon type "${obj.icon.type}" (expected "set" or "image") in ${appDir}`);
      }
    }

    return {
      id:          String(obj.id),
      name:        String(obj.name),
      entry:       String(obj.entry),
      icon:        normalizedIcon,
      version:     obj.version     ? String(obj.version)     : "0.0.1",
      description: obj.description ? String(obj.description) : "",
      permissions,
    };
  }
}
