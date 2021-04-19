import * as fs from "fs";
import * as _ from "lodash";
import { FactorioType, FactorioTypeMap } from "./types";

const brackets = /\[.*\]/g;

const additionalTriggers = {
  game: "LuaGameScript",
  script: "LuaBootstrap",
  remote: "LuaRemote",
  commands: "LuaCommandProcessor",
  player: "LuaPlayer",
  entity: "LuaEntity",
  inventory: "LuaInventory",
  gui: "LuaGui",
  force: "LuaForce",
  style: "LuaStyle",
  tile: "LuaTile",
};

export default class FactorioApiData {
  private classes: FactorioTypeMap;
  private defines: FactorioTypeMap;

  constructor(private dataPath: string) {
    this.loadData(dataPath);
  }

  public findType(words: string[]): FactorioType {
    if (words.length === 0) {
      return { properties: this.classes };
    }

    // Clean up path by removing array/dict access brackets (players[0] => players)
    words = words.map((p) => p.replace(brackets, ""));

    let type = this.classes[words.shift()];

    if (!type) {
      return null;
    }

    if (!type.properties || words.length === 0) {
      return type;
    }

    let props = type.properties;

    for (let i = 0; i < words.length; i++) {
      type = props[words[i]];

      // Not found
      if (!type) return null;

      // First try traverse it's own properties
      if (type.properties) {
        props = type.properties;
        continue;
      }

      // Then the complete type list
      let parentType = type.type;

      // Special handling for defines
      if (/defines/.test(parentType)) {
        let [__, defineName] = parentType.split(".");
        //let define = this.defines[defineName]
        return _.get(this.defines, [defineName, "properties"]);
        // return defineName && this.defines[defineName] || null
      }

      type = this.classes[parentType];

      if (type && type.properties) {
        props = type.properties;
        continue;
      }
    }

    return type;
  }

  private loadData(dataPath: string) {
    const classes = this.loadDataFile(dataPath + "/classes.json");
    const defines = this.loadDataFile(dataPath + "/defines.json");

    // Add some additional autocomplete triggers (when typing on blank line or pressing ctrl-space)
    Object.keys(additionalTriggers).forEach((trigger) => {
      let luaType = additionalTriggers[trigger];
      if (luaType in classes) {
        classes[trigger] = classes[luaType];
      }
    });

    // LuaPlayer and LuaEntity inherit from LuaControl
    // Instead of doing this manually it would be best to adjust the scraper to read the "extends" keyword
    // in the docs and do this automatically.
    // Object.assign(classes.LuaPlayer.properties, classes.LuaControl.properties)
    // Object.assign(classes.LuaEntity.properties, classes.LuaControl.properties)

    this.classes = classes;
    this.defines = defines;
    // todo: revisit this
    this.classes.defines = {
      type: "define",
      properties: defines,
    };
  }

  private loadDataFile(fileName: string): FactorioTypeMap {
    const jsonStr = fs.readFileSync(fileName, "utf8");
    const data = JSON.parse(jsonStr);
    return data;
  }
}
