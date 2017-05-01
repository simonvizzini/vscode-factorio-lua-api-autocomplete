import fs = require("fs")

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

function addAdditionalTriggers(classes) {
    Object.keys(additionalTriggers).forEach(k => {
        let luaType = additionalTriggers[k]
        if (classes[luaType]) {
            classes[k] = classes[luaType]
        }
    })
}

function loadDataFile(fileName: string): Thenable<any> {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, "utf8", (err, data) => {
            err ? reject(err) : resolve(JSON.parse(data))
        })
    })
}

function load(): Thenable<any> {
    return Promise.all([
        loadDataFile("./data/globals.json"),
        loadDataFile("./data/classes.json"),
        loadDataFile("./data/defines.json")
    ])
    .then(([globals, classes, defines]) => {
        addAdditionalTriggers(classes)
        Object.assign(classes, defines)
        return Promise.resolve({ globals, classes, defines })
    })
}

export default { load }