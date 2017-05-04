"use strict"

import vscode = require('vscode')
import FactorioApiData from "./FactorioApiData"
import { getLastMatch } from "./utils"

const { isArray } = Array
const { assign, keys } = Object

const wordsRegex = exports.wordsRegex = /([\w\[\]]+\.*[\w\[\]\.]*)/g

export class FactorioHover implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.ProviderResult<vscode.Hover>> {
        return new Promise<vscode.Hover>((resolve, reject) => {
            FactorioApiData.load().then(({ classes, defines }) => {

                let lineText = document.lineAt(position.line).text
                let wordRange = document.getWordRangeAtPosition(position)
                
                if (!wordRange) return resolve(null)
                
                let lineTillCurrentWord = lineText.substr(0, wordRange.end.character)
                let match = getLastMatch(wordsRegex, lineTillCurrentWord)
                let wordsStr = match ? match[1] : null

                if (!wordsStr) return resolve(null)

                let words = wordsStr.split(".")
                let word = words.pop()
                let type = FactorioApiData.findType(words, classes)

                if (!type) return resolve(null)

                let target

                if (type.properties && type.properties[word]) {
                    target = type.properties[word]
                } else if (type[word]) {
                    target = type[word]
                } else if (!target || (!target.type && !target.name)) {
                    return resolve(null)
                }

                let content = target.type

                if (target.name && target.name !== target.type) {
                    content = target.name + ": "  + content
                }

                if (target.doc) {
                    content += "\n\n" + target.doc
                }

                resolve(new vscode.Hover(content, wordRange))
            })
        })
    }
}
