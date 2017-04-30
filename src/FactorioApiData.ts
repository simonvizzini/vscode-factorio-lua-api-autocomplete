import { types } from "../data/factorio-api-data"

let additionalTriggers = {
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
}

Object.keys(additionalTriggers).forEach(k => {
    let luaType = additionalTriggers[k]
    if (types[luaType]) {
        types[k] = types[luaType]
    }
})

export { types as FactorioTypes }
