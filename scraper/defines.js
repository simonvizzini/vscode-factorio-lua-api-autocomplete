const osmosis = require("osmosis")
const fs = require("fs")
const htmlToText = require("html-to-text")

const { getMatches } = require("./utils")
const { baseUrl, htmlToTextConfig } = require("./config")
const { keys, assign } = Object

let defines = {}

const URL = baseUrl + "/defines.html"

function scrape() {
    defines = {}
    return new Promise((resolve, reject) => {
        osmosis
            .get(URL)
            .find("div.element table.brief-members tr")
            .set("name", "td.header")
            .select("td.description")
            .set("doc", (context) => {
                let { innerHTML } = context
                if (!innerHTML || innerHTML.trim() === "") return
                return htmlToText.fromString(innerHTML, htmlToTextConfig)
            })
            .data(data => {
                let parts = getMatches(/\w+/g, data.name)

                let define = parts.reduce((define, part, i) => {
                    if (!define[part]) define[part] = { type: "define" }

                    if (i < parts.length - 1) {
                        if (!define[part].properties) {
                            define[part].properties = {}
                        }
                        return define[part].properties
                    }
                    return define[part]
                }, defines)

                assign(define, data)
            })
            .log(console.log)
            .error(console.log)
            //.debug(console.log)
            .done(() => {
                console.log(`done: ${keys(defines).length} defines parsed`)
                resolve(defines)
            })
    })
}

exports.scrape = scrape
