const osmosis = require("osmosis")
const fs = require("fs")
const htmlToText = require("html-to-text")

const { splitFnRegex, arrayToObject } = require("./utils")
const { baseUrl, htmlToTextConfig } = require("./config")
const { keys } = Object
const { isArray } = Array

let globals = {}
let classes = {}

const URL = baseUrl

function scrape() {
    globals = classes = {}
    return new Promise((resolve, reject) => {
        osmosis
            .get(URL)
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
                globals = data.globals
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
                doc: "body > div.element > p:not(:empty)",
                properties: osmosis
                    .find("body > div.element > div.element")
                    .set({
                        name: "span.element-name",
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
                    .select("div.element-content")
                    .set("doc", (context, data) => {
                        return htmlToText
                            .fromString(context.innerHTML, htmlToTextConfig)
                            // Some quick and dirty tweaks, should be improved in the future
                            // Replace multiple newlines with just two
                            //.replace(/\n\s*\n\s*\n/g, "\n\n")
                            .replace(/\n\s*\n/g, "\n")
                            // Add a newline before "Note:"
                            .replace(/Note\:/g, "\n\n$&")
                            .replace(/Parameters/g, "$&\n\n")
                    })
                    .then((context, data) => {

                        // Some ugly post processing required here...
                        if (splitFnRegex.test(data.name)) {
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
                            let [_, funcName, funcParams] = data.name.match(splitFnRegex)
                            funcParams = funcParams.split(", ").filter(Boolean)

                            if (!data.args && funcParams.length) {
                                data.args = funcParams.map(arg => ({ name: arg, type: arg }))
                            }

                            // Sometimes functions have more arguments than are listed in the docs,
                            // so let's fill them out
                            if (data.args && funcParams.length && funcParams.length !== data.args.length) {
                                funcParams.forEach(paramStr => {
                                    // param is missing in the args, lets add it
                                    if (!data.args.some(param => param.name === paramStr)) {
                                        data.args.push({ name: paramStr, type: paramStr })
                                    }
                                })
                            }
                        }

                        if (data.args) {
                            data.args = arrayToObject(data.args)
                        }
                    })
            })
            .then((context, data) => {
                console.log(`PROCESSED :: [${data.name}]`)

                // Sometimes docs are wrapped in multiple <p> tags and so we get an array
                if (isArray(data.doc)) {
                    data.doc = data.doc.join("\n")
                }

                if (data.properties) {
                    data.properties = arrayToObject(data.properties)
                }
            })
            .data(data => {
                classes[data.name] = data
            })
            .log((...args) => {
                if ((/follow/).test(args[0])) return
                console.log(...args)
            })
            .error(console.log)
            //.debug(console.log)
            .done(() => {
                console.log(`done: ${keys(classes).length} classes and ${keys(globals).length} globals parsed`)
                resolve({ globals, classes})
            })
    })
}

exports.scrape = scrape
