"use strict"

import vscode = require("vscode")
import { FactorioCompletionItemProvider } from "./FactorioCompletionItemProvider"

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider({ language: "lua", scheme: "file" },
        new FactorioCompletionItemProvider(), '.')
    );
}

// this method is called when your extension is deactivated
export function deactivate() {
}