"use strict"

import vscode = require("vscode")
import { FactorioAutocomplete } from "./FactorioAutocomplete"

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
        { language: "lua", scheme: "file" },
        new FactorioAutocomplete(), '.')
    );
}

// this method is called when your extension is deactivated
export function deactivate() {
}