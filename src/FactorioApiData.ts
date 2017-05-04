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

let brackets = /\[.*\]/g

function findType(words: string[], factorioTypes: any): any {
    if (words.length === 0) {
        return { properties: factorioTypes }
    }

    // Clean up path by removing array/dict access brackets (players[0] => players)
    words = words.map(p => p.replace(brackets, ""))

    let type = factorioTypes[words.shift()]

    if (!type) {
        return null
    }

    if (!type.properties || words.length === 0) {
        return type
    }

    let props = type.properties

    for (let i = 0; i < words.length; i++) {
        type = props[words[i]]

        // Not found
        if (!type) return null

        // First try traverse it's own properties
        if (type.properties) {
            props = type.properties
            continue
        }

        // Then the complete type list
        let parentType = type.type

        // Special handling for defines
        if (/defines/.test(parentType)) {
            let defineName = parentType.split(".")[1]
            return defineName && factorioTypes.defines.properties[defineName] || null
        }

        type = factorioTypes[parentType]

        if (type && type.properties) {
            props = type.properties
            continue
        }
    }

    return type
}

export default {
    load,
    findType
}