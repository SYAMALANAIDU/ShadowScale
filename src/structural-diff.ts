export type DifferenceType =
  | "VALUE_MISMATCH"
  | "TYPE_MISMATCH"
  | "MISSING_IN_SHADOW"
  | "MISSING_IN_PRIMARY";

export interface JsonDifference {
  path: string;
  type: DifferenceType;
  primaryValue: unknown;
  shadowValue: unknown;
}

function getType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

export function compareJson(
  primary: unknown,
  shadow: unknown
) {
  const differences: JsonDifference[] = [];

  function compare(
    a: unknown,
    b: unknown,
    currentPath: string
  ): void {
    const typeA = getType(a);
    const typeB = getType(b);

    if (typeA !== typeB) {
      differences.push({
        path: currentPath,
        type: "TYPE_MISMATCH",
        primaryValue: a,
        shadowValue: b,
      });
      return;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      const maxLength = Math.max(a.length, b.length);

      for (let i = 0; i < maxLength; i++) {
        const itemPath = `${currentPath}[${i}]`;

        if (i >= a.length) {
          differences.push({
            path: itemPath,
            type: "MISSING_IN_PRIMARY",
            primaryValue: "<missing>",
            shadowValue: b[i],
          });
        } else if (i >= b.length) {
          differences.push({
            path: itemPath,
            type: "MISSING_IN_SHADOW",
            primaryValue: a[i],
            shadowValue: "<missing>",
          });
        } else {
          compare(a[i], b[i], itemPath);
        }
      }

      return;
    }

    if (
      a !== null &&
      b !== null &&
      typeof a === "object" &&
      typeof b === "object"
    ) {
      const objectA = a as Record<string, unknown>;
      const objectB = b as Record<string, unknown>;

      const keys = new Set([
        ...Object.keys(objectA),
        ...Object.keys(objectB),
      ]);

      for (const key of keys) {
        const keyPath = `${currentPath}.${key}`;

        if (!(key in objectA)) {
          differences.push({
            path: keyPath,
            type: "MISSING_IN_PRIMARY",
            primaryValue: "<missing>",
            shadowValue: objectB[key],
          });
        } else if (!(key in objectB)) {
          differences.push({
            path: keyPath,
            type: "MISSING_IN_SHADOW",
            primaryValue: objectA[key],
            shadowValue: "<missing>",
          });
        } else {
          compare(objectA[key], objectB[key], keyPath);
        }
      }

      return;
    }

    if (!Object.is(a, b)) {
      differences.push({
        path: currentPath,
        type: "VALUE_MISMATCH",
        primaryValue: a,
        shadowValue: b,
      });
    }
  }

  compare(primary, shadow, "$");

  return {
    matches: differences.length === 0,
    differenceCount: differences.length,
    differences,
  };
}