import * as osmosis from "osmosis"
import * as fs from "fs"
import * as htmlToText from "html-to-text"
import * as _ from "lodash"

import { splitFnRegex, arrayToObject, parseHtml } from "./utils"
import config from "./config"

const { keys } = Object
const { isArray } = Array

const URL = config.baseUrl + "/Classes.html"

export const scrape = () => {
    let classes: FactorioTypeMap = {}

    return new Promise((resolve, reject) => {
        osmosis
            .get(URL)
            .find("body > div.brief-listing > div.brief-listing")
            .set({
                name: "span.type-name > a",
                type: "span.type-name > a",
                inherits: ["div:contains('Inherited from')"]
            })
            .then((context, data, next) => {
                console.log("current: ", data.name)
                classes[data.name] = data
                next(context, {})
            })
            .fail("a:nth-child(2):contains('ControlBehavior')")
            .select("span.type-name > a")
            .follow("@href")
            .find("body > div.brief-listing > div.brief-listing")
            .set({
                name: "span.type-name",
                properties: [
                    osmosis
                        .find("table.brief-members > tr")
                        .set({
                            name: "span.element-name > a",
                            type: "span.param-type > a",
                            mode: "span.attribute-mode",
                            doc: "td.description:not(:empty)"
                        })
                ]
            })
            .then((document, data, next) => {
                _.merge(classes[data.name], data)
                next(document.querySelector("#" + data.name), {})
            })
            .set({
                name: "node() !> div@id", // gets the id of parent div.element (!> is parent)
                doc: "p:first",
                properties: [
                    osmosis
                        .find("div.element")
                        .set({
                            name: "span.element-name",
                            type: "span.param-type:first",
                            returns: "span.return-type > span.param-type",
                            args: [
                                osmosis
                                    .find("div.element-content .detail-header:contains(Parameters) + .detail-content > div")
                                    .set({
                                        name: "span.param-name",
                                        // TODO: Missing types. e.g. LuaCircuitNetwork.get_signal(SignalID)
                                        type: "span.param-type:first"
                                    })
                                    .set("doc", (context) => {
                                        return parseHtml(context.innerHTML)
                                    })
                            ]
                        })
                        .select("div.element-content")
                        .set("doc", (context) => {
                            return parseHtml(context.innerHTML)
                        })
                ]
            })
            .then((context, data, next) => {
                const notString = (obj) => !_.isEmpty(obj) && typeof obj !== "string"

                data.properties = data.properties.filter(notString)

                data.properties.forEach((prop) => {
                    if (_.isEmpty(prop.doc)) {
                        delete prop.doc
                    }

                    // Check if this is a function
                    if (splitFnRegex.test(prop.name)) {
                        let [__, fnName] = prop.name.match(splitFnRegex)
                        prop.name = fnName
                        prop.type = "function"
                    }

                    if (!_.isArray(prop.args)) {
                        prop.args = [prop.args]
                    }

                    prop.args = _(prop.args)
                        .filter(notString)
                        .each((arg) => {
                            if (!arg.type) {
                                arg.type = arg.name
                            }
                        })

                    if (prop.args.length === 0) {
                        delete prop.args
                    }
                })

                _.merge(classes[data.name], data)

                next(context, {})
            })
            .log((msg) => {
                if (/follow|find/.test(msg)) return
                console.log(msg)
            })
            .error(console.log)
            //.debug(console.log)
            .done(() => {
                _.forOwn(classes, (type, key) => {
                    _.forEach(type.properties, (prop: FactorioType) => {
                        if (prop.args) {
                            prop.args = arrayToObject(prop.args as any)
                        }
                    })

                    if (type.inherits.length) {
                        handleInheritance(type, classes)
                    }

                    type.properties = arrayToObject(type.properties as any)

                    // comment for debugging
                    // delete type.inherits
                })

                // Sort classes by key
                classes = _(classes).toPairs().sortBy(0).fromPairs().value()
                console.log(`done: ${Object.keys(classes).length} classes`)
                resolve(classes)
            })
    })
}

const handleInheritance = (type, typeMap) => {
    // Merge properties from parent classes
    type.inherits.reduce((type, inheritStr: string) => {
        let [__, fromStr, propsStr] = inheritStr.match(/Inherited from (\w+): (.*)/)
        const from = typeMap[fromStr]

        if (!from) {
            console.error(`${type.name} inherits from ${from}, but ${from} doesn't exit!`)
            return type
        }

        let propsStrArr = propsStr.split(", ")

        propsStrArr.forEach((propStr) => {
            let fromProp = from.properties[propStr]

            if (!fromProp) {
                console.error(`${from.name} has no property ${propStr}`)
                return
            }

            type.properties.push(fromProp)
        })

        return type
    }, type)
}
