export interface FactorioTypeMap {
  [prop: string]: FactorioType;
}

export interface FactorioType {
  type?: string;
  name?: string;
  doc?: string;
  mode?: string;
  properties?: FactorioTypeMap;
  args?: FactorioTypeMap;
  returns?: string;
  inherits?: string[];
}
