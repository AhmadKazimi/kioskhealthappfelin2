/* eslint-disable @typescript-eslint/no-explicit-any */
export function getEnumName(enumObj: any, value?: unknown, defaultName = "") {
  try {
    if (!enumObj || value === undefined || value === null) return defaultName;

    const candidateKeys = Object.keys(enumObj).filter((k) => k !== "values");

    for (const key of candidateKeys) {
      const ev = enumObj[key];
      if (ev === value) return key;
      const evNum = ev && typeof ev === "object" && "value" in ev ? (ev as any).value : ev;
      const valNum =
        value && typeof value === "object" && "value" in (value as any)
          ? (value as any).value
          : value;
      if (typeof evNum === "number" && typeof valNum === "number" && evNum === valNum) return key;
    }
  } catch {
    // Ignore enum parsing errors
  }
  return defaultName;
}

export function makeEnumFromName(enumObj: any, name: string) {
  try {
    if (!enumObj) return undefined;
    return Object.prototype.hasOwnProperty.call(enumObj, name) ? enumObj[name] : undefined;
  } catch {
    return undefined;
  }
}

export function getEnumNames(enumObj: any) {
  try {
    return enumObj ? Object.keys(enumObj).filter((x) => x !== "values") : [];
  } catch {
    return [];
  }
}
