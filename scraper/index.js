const osmosis = require("osmosis")
const fs = require("fs")

const fnParts = /(.+)(?:\(|\{)(.*)(?:\}|\))/
const output = {}

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

osmosis
    .get("http://127.0.0.1:8080/Classes.html")
    .find("span.type-name > a")
    .follow("@href")
    .then(context => {
        let name = context.querySelector("body > h1").text()
        console.log(`TRYING :: [${name}]`)
    })
    .set({
        name: "body > h1",
        type: "body > h1",
        doc: "body > div.element > p",
        properties: osmosis.find("body > div.element > div.element")
                        .set({
                            name: "span.element-name",
                            doc: "div.element-content",
                            type: "span.attribute-type > span.param-type",
                            returns: "span.return-type > span.param-type",
                            mode: "span.attribute-mode",
                            notes: "span.notes",
                            args: [
                                osmosis.find("div.element-content .detail-header:contains(Parameters) + .detail-content > div")
                                    .set("doc", (context) => {
                                        return context.text().trim()
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

                            // TODO: Better way to parse the docs, sometimes they are strange
                            if (data.doc) {
                                data.doc = data.doc.split("\n")[0].trim()
                            }

                            if (!data.type) {
                                data.type = data.name
                            }

                            // Filter out args that are strings
                            if (data.args) {
                                data.args = data.args.filter(s => typeof s !== "string")
                            }

                            // TODO: Properly parse functions with table params
                            // e.g. LuaControl.set_gui_arrow
                            // LuaGameScript.take_screenshot

                            // TODO: Sometimes not all args are listed, so parse the function string and insert missing args
                            // BUT WHICH ONE WAS IT ????
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
        if (data.properties) {
            data.properties = toObject(data.properties)
        }
    })
    .data(data => {
        output[data.name] = data
    })
    .log((...args) => {
        if ((/follow/).test(args[0])) return
        console.log(...args)
    })
    .error(console.log)
    //.debug(console.log)
    .done(() => {
        console.log(`done: ${Object.keys(output).length} items parsed`)

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
