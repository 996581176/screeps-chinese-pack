import { Optimizer } from "@parcel/plugin";

import type { ConfigResultWithFilePath } from "@parcel/types/lib/index";

type MyConfig = { [key: string]: string | string[] };

export default new Optimizer({
  async loadConfig({ config }) {
    let { contents } =
      (await config.getConfig<MyConfig>(["meta.json"])) || ({} as Partial<ConfigResultWithFilePath<MyConfig>>);
    return contents;
  },
  async optimize({ contents, map, config }) {
    if (config) {
      let strArr: string[] = [];
      strArr.push("// ==UserScript==");
      Object.entries(config).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            strArr.push(`// ${key}${generateSpace(14 - key.length)}${item}`);
          });
        } else {
          strArr.push(`// ${key}${generateSpace(14 - key.length)}${value}`);
        }
      });
      strArr.push("// ==/UserScript==\n");
      contents = strArr.join("\n") + contents;
    }
    return {
      contents,
      map,
    };
  },
});

/** 生成空格 */
function generateSpace(length: number) {
  let str = "";
  for (let index = 0; index < length; index++) {
    str += " ";
  }
  return str;
}
