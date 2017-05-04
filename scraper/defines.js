const osmosis = require("osmosis")
const fs = require("fs")
const htmlToText = require("html-to-text")

const { getMatches } = require("./utils")
const { baseUrl, htmlToTextConfig } = require("./config")
const { keys, assign } = Object

const DEFINES_URL = baseUrl + "/defines.html"
const EVENTS_URL = baseUrl + "/events.html"

function scrape() {
    const definesPromise = new Promise((resolve, reject) => {
        let defines = {}

        osmosis
            .get(DEFINES_URL)
            .find("div.element table.brief-members tr")
            .set("name", "td.header")
            .select("td.description")
            .set("doc", (context) => {
                let { innerHTML } = context
                if (!innerHTML || innerHTML.trim() === "") return
                return htmlToText.fromString(innerHTML, htmlToTextConfig)
            })
            .data((data, next) => {
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
            .done(() => {
                console.log(`done: ${keys(defines).length} defines parsed`)
                resolve(defines)
            })
    })

    const eventsPromise = new Promise((resolve, reject) => {
        let events = []

        osmosis
            .get(EVENTS_URL)
            .find("div.element")
            .set("name", "div.element-header")
            .select("div.element-content")
            .set("doc", (context) => {
                return htmlToText
                    .fromString(context.innerHTML, htmlToTextConfig)
                    // Some quick and dirty tweaks, should be improved in the future
                    // Replace multiple newlines with just one
                    .replace(/\n\s*\n/g, "\n\n")
                    .replace(/\n*(Contains)\n*/g, "\n\n$1\n\n")
                    .replace(/[^ ]\n*(Note\:)\n*/g, "\n\n$1")
            })
            .data((data) => {
                data.type = "event"
                events.push(data)
            })
            .log(console.log)
            .error(console.log)
            //.debug(console.log)
            .done(() => {
                console.log(`done: ${keys(events).length} events parsed`)
                resolve(events)
            })
    })
    return new Promise((resolve, reject) => {
        Promise
            .all([definesPromise, eventsPromise])
            .then(([defines, events]) => {
                // merge events
                events.forEach(event => {
                    // Huh....
                    if (defines.defines.properties.events.properties[event.name]) {
                        defines.defines.properties.events.properties[event.name] = event
                    }
                })

                resolve(defines)
            })
    })
}

exports.scrape = scrape
