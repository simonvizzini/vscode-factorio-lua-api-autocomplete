"use strict"

import vscode = require("vscode")
import { FactorioAutocomplete } from "./FactorioAutocomplete"
import { FactorioHover } from "./FactorioHover"

const LUA_MODE = { language: "lua", scheme: "file" }

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            LUA_MODE,
            new FactorioAutocomplete(),
            '.'
        )
    )

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            LUA_MODE,
            new FactorioHover()
        )
    )
}

// this method is called when your extension is deactivated
export function deactivate() {
}