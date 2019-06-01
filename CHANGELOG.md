# Changelog

## 0.7.0 - 2019-06-01
- Update to Factorio 0.17.45

## 0.6.0 - 2018-08-11
- Update to Factorio 0.16.51
- Autocomplete items now properly render markdown strings thanks to VS Codes addition of `MarkdownString` class

## 0.5.0 - 2017-07-31
- Update to Factorio 0.15.31

## 0.4.0 - 2017-06-04
- Class inheritance is now considered, meaning classes now also suggest properties of their parent classes (e.g. LuaEntity now properly displays properties inherited from LuaControl)
- Tooltips are now rendered as markdown, including links to the official documentation
- Added support for all LuaControlBehavior classes
- Issue: vscode autocomplete items unfortunately don't support markdown strings, and so the raw markdown string will be displayed.

## 0.3.2 - 2017-05-05
- Fixed data file loading issue

## 0.3.1 - 2017-05-04
- Tried to fix data file loading issue

## 0.3.0 - 2017-05-04
- Added mouse hover tooltips
- Added events documentation
- Fixed wrong type lookup in some cases

## 0.2.0 - 2017-05-01
- Added autocomplete for [defines](http://lua-api.factorio.com/latest/defines.html)
- Prettier type documentation with the help of [html-to-text](https://github.com/werk85/node-html-to-text)

## 0.1.1 - 2017-04-30
- Added license and repository

## 0.1.0 - 2017-04-30
- Initial release