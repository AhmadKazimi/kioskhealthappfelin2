/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get the name of an enum value from a Shen AI SDK Proxy-based enum
 * Handles both old-style numeric enums and new SDK Proxy enums with .value property
 */
export function getEnumName(enumObj: any, value?: any, defaultName = "") {
  // Extract numeric value if it's an object with .value property (SDK Proxy enum)
  const numericValue = typeof value === "object" && value !== null && "value" in value
    ? value.value
    : value;

  // Handle function-based enums (old style)
  if (typeof enumObj === "function" && numericValue !== undefined && numericValue !== null) {
    const key = Object.keys(enumObj).find((key) => {
      const enumValue = enumObj[key];
      // Handle both numeric values and SDK enum objects with .value
      const compareValue = typeof enumValue === "object" && "value" in enumValue
        ? enumValue.value
        : enumValue;
      return compareValue === numericValue;
    });
    return key || defaultName;
  }

  // Handle Proxy-based enums (new SDK style)
  if (enumObj && numericValue !== undefined && numericValue !== null) {
    try {
      const keys = Object.keys(enumObj);
      const key = keys.find((key) => {
        const enumValue = enumObj[key];
        const compareValue = typeof enumValue === "object" && "value" in enumValue
          ? enumValue.value
          : enumValue;
        return compareValue === numericValue;
      });
      return key || defaultName;
    } catch (e) {
      // Fallback if enumObj is not enumerable
      return defaultName;
    }
  }

  return defaultName;
}

export function makeEnumFromName(enumObj: any, name: string) {
  console.log("makeEnumFromName", name, enumObj, typeof enumObj);
  return typeof enumObj === "function" && enumObj.hasOwnProperty(name)
    ? enumObj[name]
    : undefined;
}

export function getEnumNames(enumObj: any) {
  return typeof enumObj === "function"
    ? Object.keys(enumObj).filter((x) => x != "values")
    : [];
}
