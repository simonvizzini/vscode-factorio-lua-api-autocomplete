"use strict"

import vscode = require('vscode')
import FactorioApiData from "./FactorioApiData"
import { getLastMatch, keys, assign } from "./utils"

const wordsRegex = /([\w\[\]]+\.[\w\[\]\.]*)/g

export class FactorioAutocomplete implements vscode.CompletionItemProvider {
    constructor(private apiData) { }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {
        return new Promise<vscode.CompletionItem[]>((resolve, reject) => {
            const { classes, defines } = this.apiData

            let lineText = document.lineAt(position.line).text
            let lineTillCurrentPosition = lineText.substr(0, position.character)

            let match = getLastMatch(wordsRegex, lineTillCurrentPosition)
            let line = match ? match[1] : ""

            let words = line.split(".")
            words.pop()

            let type = FactorioApiData.findType(words, classes)

            if (!type || !type.properties) {
                return resolve([])
            }

            let suggestions = toCompletionItems(type.properties)
            return resolve(suggestions)
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
