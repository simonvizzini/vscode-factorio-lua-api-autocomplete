import * as fs from "fs";

/**
 * Extracts a function from a string and splits it into two parts:
 *  - function name
 *  - parameters
 *
 * Example:
 *
 * "set_tiles(tiles, correct_tiles)".match(...)
 * => [__, "set_tiles", "tiles, correct_tiles"]
 */
export const splitFnRegex = /(\S+)(?:\(|\{)(.*)(?:\}|\))/;

export const wordsRegex = /([\w\[\]]+\.[\w\[\]\.]+)+/g;

export const writeJson = (fileName, obj) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, JSON.stringify(obj, null, 2), "utf8", (err) => {
      if (err) return reject(err);
      console.log(`writeJson: "${fileName}" success`);
      resolve(undefined);
    });
  });
};

export const arrayToObject = (array: any[]) => {
  return array
    .sort((a, b) => a.name.localeCompare(b.name))
    .reduce((obj, item) => {
      let { name } = item;
      // if it's a function, get rid of the params (??? check again later, needs improvements)
      if (exports.splitFnRegex.test(name)) {
        name = item.name.match(exports.splitFnRegex)[1];
      }
      obj[name] = item;
      return obj;
    }, {});
};

export const getRegexMatches = (regex, str) => {
  let match = null,
    matches = [];
  while ((match = regex.exec(str)) !== null) {
    matches.push(match[0]);
  }
  return matches;
};

export const getLastMatch = (regex, str) => {
  return getRegexMatches(regex, str).slice(-1).pop();
};

// /<\/?(tag)[^><]*>/g
const tagsRegex = (tag) => new RegExp("<\\/?(" + tag + ")[^><]*>", "g");
const latestUrl = "http://lua-api.factorio.com/latest/";

// This whole function is complete bullshit, but it works much better than htmlToText or pandoc.
// Very fragile, much regex. I pray I won't have to touch this anytime soon again.
// At least some unit tests would be good though...
export const parseHtml = (htmlStr) => {
  return (
    htmlStr
      .replace(tagsRegex("span|ul|p"), "")
      .replace(tagsRegex("div|br|li"), "\n\n")
      // .replace(tagsRegex("li"), "\n\n")
      .replace(tagsRegex("strong"), "**")
      .replace(tagsRegex("em"), "_")
      .replace(tagsRegex("code"), "````\n")
      // Make some markdown links
      .replace(
        /<a href="([\w\.#-]*)">([\w\s\.:]*)<\/a>/g,
        "[$2](" + latestUrl + "$1)"
      )

      // And now let's try to clean up all those broken newlines and whitespaces...
      // Very fun
      // Replace multiple whitespaces with one
      .replace(/[ ]+/g, " ")
      // Prepend two spaces before single line breaks (so markdown renders a single line break correctly)
      .replace(/[^`].(\n)./g, "  \n")
      // Replace multiple newlines with a single markdown-style newline
      .replace(/\n\s*\n/g, "  \n")
      // Remove spaces after new lines (affects some code blocks)
      .replace(/\n /g, "\n")
      // Replace unnecessary new lines between words
      .replace(/\w\n\w/g, "")

      // Wrap some stuff with newlines for a nicer look
      .replace(/\n*(Parameters)[\n\s]*/g, "\n\n**$1**  \n")
      .replace(/\n*(Return value)[\n\s]*/g, "\n\n**$1**  \n")
      .replace(/\n*(Example)[\n\s]/g, "\n\n**$1** ")
      .replace(/\n*(Contains)[\n\s]/g, "\n\n**$1** ")
      .replace(/\n*(\*\*Note:)/g, "\n\n$1")

      // Replace newlines at the beginning
      .replace(/^[\s\n]+/, "")
      // Replace newlines at the end
      .replace(/[\s\n]+$/, "")
  );
};
