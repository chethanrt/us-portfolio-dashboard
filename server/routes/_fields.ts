/**
 * Declarative JS-object <-> SQLite-row field mapping, shared by every
 * entity route. Each entity lists its fields once; fromRow/toRow are
 * derived from that single list instead of being hand-written twice per
 * entity (and risking the two drifting apart).
 */
export interface FieldDef {
  /** Key on the JS object (matches the TS interface in src/types). */
  js: string;
  /** Column name in SQLite. */
  db: string;
  toDb?: (value: any) => any;
  fromDb?: (value: any) => any;
}

export function buildRowMapper(fields: FieldDef[], idColumn = "id") {
  function fromRow(row: Record<string, any>): Record<string, any> {
    const obj: Record<string, any> = { id: row[idColumn] };
    for (const f of fields) {
      obj[f.js] = f.fromDb ? f.fromDb(row[f.db]) : row[f.db];
    }
    return obj;
  }

  /** Only maps keys actually present in `payload` — safe for both full-replacement and partial-patch callers. */
  function toRow(payload: Record<string, any>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    for (const f of fields) {
      if (!(f.js in payload)) continue;
      row[f.db] = f.toDb ? f.toDb(payload[f.js]) : payload[f.js];
    }
    return row;
  }

  return { fromRow, toRow };
}

export const jsonArrayField = {
  toDb: (v: unknown) => JSON.stringify(v ?? []),
  fromDb: (v: string | null) => (v ? JSON.parse(v) : []),
};

export const boolField = {
  toDb: (v: unknown) => (v ? 1 : 0),
  fromDb: (v: number | null) => Boolean(v),
};

export const nullableField = {
  toDb: (v: unknown) => v ?? null,
  fromDb: (v: unknown) => v ?? null,
};
