# Factorio API autocomplete extension

## Features

- Autocomplete of all Lua classes and globals

  ![autocomplete](images/autocomplete.gif)

- Mouse hover tooltips, with links to the official documentation at http://lua-api.factorio.com

  ![tooltips](images/tooltips.gif)


## Todo

#### Features
- Better support for functions that take tables as argument
- Function signature hints (**registerSignatureHelpProvider**)

#### Technical tasks
- Instead of storing inherited properties in the data file, they should maybe get looked up during runtime
- Unit tests

## [Changelog](CHANGELOG.md)
