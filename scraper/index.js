const osmosis = require("osmosis")
const fs = require("fs")
const htmlToText = require("html-to-text")

const fnParts = /(.+)(?:\(|\{)(.*)(?:\}|\))/

const output = {
    globals: {},
    classes: {}
}

const htmlToTextConfig = {
    ignoreHref: true
}

osmosis
    .get("http://127.0.0.1:8080")
    .find("body > ul.field-list:first")
    .set({
        globals: osmosis
                    .find("li")
                    .set("doc", (context) => {
                        return htmlToText.fromString(context.innerHTML, htmlToTextConfig)
                    })
                    .set({
                        name: "span.param-name",
                        type: "span.param-type"
                    })
    })
    .then((context, data, next) => {
        output.globals = data.globals
        next(context, {})
    })
    .find("body > div.brief-listing:first tr > td.header > a")
    .follow("@href")
    .then((context) => {
        let name = context.querySelector("body > h1").text()
        console.log(`TRYING :: [${name}]`)
    })
    .set({
        name: "body > h1",
        type: "body > h1",
        doc: osmosis
                .find("body > div.element > p:not(:empty)")
                .then(context => {
                    return htmlToText.fromString(context.innerHTML, htmlToTextConfig)
                }),
        properties: osmosis
                        .find("body > div.element > div.element")
                        .set({
                            name: "span.element-name",
                            doc: "div.element-content",
                            type: "span.attribute-type > span.param-type",
                            returns: "span.return-type > span.param-type",
                            mode: "span.attribute-mode",
                            notes: "span.notes",
                            args: [
                                osmosis
                                    .find("div.element-content .detail-header:contains(Parameters) + .detail-content > div")
                                    .set("doc", (context) => {
                                        return htmlToText.fromString(context.innerHTML, htmlToTextConfig)
                                    })
                                    .set({
                                        name: "span.param-name",
                                        // TODO: Missing types. e.g. LuaCircuitNetwork.get_signal(SignalID)
                                        type: "span.param-type",
                                    })
                                    .then((context, data) => {
                                        if (data.doc === "") delete data.doc
                                    })
                            ]
                        })
                        .then((context, data) => {
                            if (fnParts.test(data.name)) {
                                data.type = "function"
                            } else {
                                // delete empty args if it's not a function
                                delete data.args
                            }

                            if (!data.type) {
                                data.type = data.name
                            }

                            // Filter out args that are strings
                            if (data.args) {
                                data.args = data.args.filter(s => {
                                    return typeof s !== "string"
                                })
                            }

                            // TODO: Properly parse functions with table params
                            // e.g. LuaControl.set_gui_arrow
                            // LuaGameScript.take_screenshot

                            if (data.type === "function") {
                                let [_, funcName, params] = data.name.match(fnParts)
                                params = params.split(", ").filter(Boolean)

                                if (!data.args && params.length) {
                                    data.args = params.map(arg => ({ name: arg, type: arg }))
                                }

                                if (data.args && params.length && params.length !== data.args.length) {
                                    params.forEach(paramStr => {
                                        if (!data.args.some(param => param.name === paramStr)) {
                                            data.args.push({ name: paramStr, type: paramStr })
                                        }
                                    })
                                }
                            }

                            if (data.args) {
                                data.args = toObject(data.args)
                            }
                        })
    })
    .then((context, data) => {
        console.log(`PROCESSED :: [${data.name}]`)

        // Sometimes docs are wrapped in multiple <p> tags
        if (Array.isArray(data.doc)) {
            data.doc = data.doc.join("\n")
        }

        if (data.properties) {
            data.properties = toObject(data.properties)
        }
    })
    .data(data => {
        output.classes[data.name] = data
    })
    .log((...args) => {
        if ((/follow/).test(args[0])) return
        console.log(...args)
    })
    .error(console.log)
    //.debug(console.log)
    .done(() => {
        console.log(`done: ${Object.keys(output.classes).length} classes and ${Object.keys(output.globals).length} globals parsed`)

        fs.writeFile("./data/factorio-api-data.json", JSON.stringify(output), err => {
            if (err) {
                throw err
            }
            console.log("json written")
        })

        fs.writeFile("./data/factorio-api-data.ts", "export const types = " + JSON.stringify(output), err => {
            if (err) {
                throw err
            }
            console.log("ts written")
        })
    })


function debug(context, data, next) {
    debugger
}

function toObject(array) {
    return array.reduce((obj, item) => {
        let name = item.name
        if (fnParts.test(name)) {
            name = item.name.match(fnParts)[1]
        }
        obj[name] = item
        return obj
    }, {})
}
