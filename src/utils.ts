export const { isArray } = Array
export const { assign, keys } = Object

export const getMatches = (regex: RegExp, str: string) : string[] => {
    let match = null, matches = []
    while ((match = regex.exec(str)) !== null) {
        matches.push(match)
    }
    return matches
}

export const getLastMatch = (regex: RegExp, str: string) : string => {
    return getMatches(regex, str).slice(-1).pop()
}

export const each = (data: any[] | {}, callback: (value: any, key: string | number) => any)  =>{
    isArray(data) ?
        data.forEach(callback) :
        keys(data).forEach(k => callback(data[k], k))
}

export const reduce = (data: any[] | {}, callback: (prev: any, curr: any, key: string | number) => any, initial?: any): any  => {
    return isArray(data) ?
        data.reduce(callback, initial) :
        keys(data).reduce((prev, key) => callback(prev, data[key], key), initial)
}
