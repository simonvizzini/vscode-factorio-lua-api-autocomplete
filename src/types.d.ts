interface FactorioTypeMap {
    [prop: string]: FactorioType
}

interface FactorioType {
    type?: string
    name?: string
    doc?: string
    mode?: string
    properties?: FactorioTypeMap
    args?: FactorioTypeMap
    returns?: string
    inherits?: string[]
}
