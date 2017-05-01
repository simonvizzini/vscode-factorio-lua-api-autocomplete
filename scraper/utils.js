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
const splitFnRegex = /(\S+)(?:\(|\{)(.*)(?:\}|\))/
exports.splitFnRegex = splitFnRegex

exports.writeJson = function writeJson(fileName, obj) {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, JSON.stringify(obj, null, 2), "utf8", err => {
            if (err) return reject()
            console.log(`writeJson: "${fileName}" success`)
            resolve()
        })
    })
}

exports.arrayToObject = function arrayToObject(array) {
    return array.reduce((obj, item) => {
        let { name } = item
        // if it's a function, get rid of the params (??? check again later, needs improvements)
        if (splitFnRegex.test(name)) {
            name = item.name.match(splitFnRegex)[1]
        }
        obj[name] = item
        return obj
    }, {})
}

exports.getMatches = function getRegexMatches(regex, str) {
    let match,
        matches = []
    while ((match = regex.exec(str)) !== null) {
        matches.push(match[0])
    }
    return matches
}

exports.debug = function debug(context, data, next) {
    debugger
}
