"use strict"

import vscode = require('vscode')
import FactorioApiData from "./FactorioApiData"

const { isArray } = Array
const { assign, keys } = Object

const wordsRegex = /(?:\=|\s|\()*(\w+\.(?:\w|\.|\[\d\])*)(?:\s|\))*/

export class FactorioCompletionItemProvider implements vscode.CompletionItemProvider {
    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {
        return FactorioApiData.load().then(({ classes, defines }) => {
            return new Promise<vscode.CompletionItem[]>((resolve, reject) => {
                let lineText = document.lineAt(position.line).text
                let lineTillCurrentPosition = lineText.substr(0, position.character)
                let match = lineTillCurrentPosition.match(wordsRegex)
                let line = match ? match[1] : ""
                let words = line.split(".")
                words.pop()

                let types = getFactorioTypesFromPath(words, classes)

                if (!types) {
                    return resolve([])
                }

                let suggestions = toCompletionItems(types)
                return resolve(suggestions)
            })
        })
    }
}

interface FactorioTypeContainer {
    [prop: string]: FactorioType
}

interface FactorioType {
    type: string
    name?: string
    doc?: string
    mode?: string
    properties?: FactorioTypeContainer
    args?: FactorioTypeContainer
    returns?: string
}

let removeBrackets = /((?:\w|\-)+)(\[(?:\d|\w)*\])*/

function getFactorioTypesFromPath(path: string[], factorioTypes: any): any {
    if (path.length === 0) {
        return factorioTypes
    }

    // Clean up path by removing array/dict access brackets (players[0] => players)
    path = path.map(p => p.match(removeBrackets)[1])

    let type = factorioTypes[path.shift()]

    if (!type) {
        return null
    }

    if (!type.properties) {
        console.log(`${type.name} has no properties`)
        // debugger
        return null
    }

    let props = type.properties

    for (let i = 0; i < path.length; i++) {
        let type = props[path[i]]

        // Not found
        if (!type) return null

        // First traverse it's own properties
        if (type.properties) {
            props = type.properties
            continue
        }

        // e.g. defines don't have a type
        if (!type.type) {
            return null
        }

        // Then the complete type list
        let [ _, nextTypeStr ] = type.type.match(removeBrackets)
        type = factorioTypes[nextTypeStr]

        if (type && type.properties) {
            props = type.properties
            continue
        }

        // Not found
        return null
    }

    return props
}

function toCompletionItems(types: FactorioTypeContainer): vscode.CompletionItem[] {
    return keys(types).map(key => toCompletionItem(types[key], <string>key))
}

function toCompletionItem(type: FactorioType, key: string): vscode.CompletionItem {
    const { doc, name, mode } = type

    let completionItem = assign(new vscode.CompletionItem(key), {
        detail: type.type,
        documentation: mode ? `${doc}\n\n${mode}` : doc,
        kind: vscode.CompletionItemKind.Property
    })

    if (type.type === "function") {
        assign(completionItem, {
            detail: name,
            kind: vscode.CompletionItemKind.Function
        })
    } else if (type.type === "define") {
        assign(completionItem, {
            kind: vscode.CompletionItemKind.Constant
        })
    }

    return completionItem
}

function each(data: any[] | {}, callback: (value: any, key: string | number) => any) {
    isArray(data) ?
        data.forEach(callback) :
        keys(data).forEach(k => callback(data[k], k))
}

function reduce(data: any[] | {}, callback: (prev: any, curr: any, key: string | number) => any, initial?: any): any {
    return isArray(data) ?
        data.reduce(callback, initial) :
        keys(data).reduce((prev, key) => callback(prev, data[key], key), initial)
}
