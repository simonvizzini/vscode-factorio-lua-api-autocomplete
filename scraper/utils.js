const fs = require("fs")

/**
 * Extracts a function from a string and splits it into two parts:
 *  - function name
 *  - parameters
 * 
 * Example:
 * 
 * "set_tiles(tiles, correct_tiles)".match(...)
 * => [__, "set_tiles", "tiles, correct_tiles"]
 */
exports.splitFnRegex = /(\S+)(?:\(|\{)(.*)(?:\}|\))/

exports.wordsRegex = /([\w\[\]]+\.[\w\[\]\.]+)+/g

exports.writeJson = (fileName, obj) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, JSON.stringify(obj, null, 2), "utf8", err => {
            if (err) return reject(err)
            console.log(`writeJson: "${fileName}" success`)
            resolve()
        })
    })
}

exports.arrayToObject = (array) => {
    return array
        .sort((a, b) => a.name.localeCompare(b.name))
        .reduce((obj, item) => {
            let { name } = item
            // if it's a function, get rid of the params (??? check again later, needs improvements)
            if (exports.splitFnRegex.test(name)) {
                name = item.name.match(exports.splitFnRegex)[1]
            }
            obj[name] = item
            return obj
        }, {})
}

exports.getMatches = (regex, str) => {
    let match = null, matches = []
    while ((match = regex.exec(str)) !== null) {
        matches.push(match[0])
    }
    return matches
}

exports.getLastMatch = (regex, str) => {
    return getMatches(regex, str).slice(-1).pop()
}

exports.debug = function debug(context, data, next) {
    debugger
}
