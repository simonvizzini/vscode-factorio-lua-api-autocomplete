"use strict"

import vscode = require("vscode")
import FactorioApiData from "./FactorioApiData"
import { FactorioAutocomplete } from "./FactorioAutocomplete"
import { FactorioHover } from "./FactorioHover"

const LUA_MODE = { language: "lua", scheme: "file" }

export function activate(context: vscode.ExtensionContext) {
    let dataPath = context.asAbsolutePath("./data")

    FactorioApiData.load(dataPath).then((apiData) => {
        context.subscriptions.push(
            vscode.languages.registerCompletionItemProvider(
                LUA_MODE,
                new FactorioAutocomplete(apiData),
                '.'
            )
        )

        context.subscriptions.push(
            vscode.languages.registerHoverProvider(
                LUA_MODE,
                new FactorioHover(apiData)
            )
        )
    })
    .catch(console.error)
}

// this method is called when your extension is deactivated
export function deactivate() {
}