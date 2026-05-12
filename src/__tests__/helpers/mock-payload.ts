import { vi } from "vitest";

type MockDataStore = Record<string, Record<string, unknown>[]>;

interface CreateMockPayloadOptions {
  stores?: Partial<MockDataStore>;
}

/**
 * Creates a mock Payload CMS client with an in-memory data store.
 * Supports simplified where-clause matching for common operators.
 */
export function createMockPayload(options: CreateMockPayloadOptions = {}) {
  const data: MockDataStore = {
    users: [],
    "managed-events": [],
    "event-registrations": [],
    "event-invites": [],
    "church-event-invites": [],
    churches: [],
    "ad-placements": [],
    "invite-scans": [],
    "platform-event-links": [],
    campaigns: [],
    media: [],
    "news-events": [],
    "online-platforms": [],
    ...options.stores,
  };

  const payload = {
    find: vi.fn(async ({ collection, where, limit, page, sort, depth, overrideAccess }: any) => {
      let docs = [...(data[collection] || [])];
      const filtered = applyWhere(docs, where);
      const effectiveLimit = limit === 0 ? filtered.length : (limit || filtered.length);
      const paged = filtered.slice(0, effectiveLimit);
      return {
        docs: paged,
        totalDocs: filtered.length,
        limit: effectiveLimit,
        totalPages: Math.ceil(filtered.length / (effectiveLimit || 1)) || 1,
        page: page || 1,
        pagingCounter: 1,
        hasPrevPage: false,
        hasNextPage: false,
      };
    }),

    findByID: vi.fn(async ({ collection, id }: any) => {
      const docs = data[collection] || [];
      const doc = docs.find((d) => String(d.id) === String(id));
      if (!doc) throw new Error(`Document with id ${id} not found in ${collection}`);
      return deepClone(doc);
    }),

    create: vi.fn(async ({ collection, data: createData }: any) => {
      const newDoc = {
        id: `${collection}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...createData,
      };
      if (data[collection]) {
        data[collection].push(newDoc);
      }
      return deepClone(newDoc);
    }),

    update: vi.fn(async ({ collection, id, data: updateData }: any) => {
      const docs = data[collection] || [];
      const idx = docs.findIndex((d) => String(d.id) === String(id));
      if (idx === -1) throw new Error(`Document with id ${id} not found in ${collection}`);
      docs[idx] = { ...docs[idx], ...updateData, updatedAt: new Date().toISOString() };
      return deepClone(docs[idx]);
    }),

    delete: vi.fn(async ({ collection, id }: any) => {
      const docs = data[collection] || [];
      const idx = docs.findIndex((d) => String(d.id) === String(id));
      if (idx === -1) throw new Error(`Document with id ${id} not found in ${collection}`);
      const deleted = docs.splice(idx, 1)[0];
      return deepClone(deleted);
    }),

    count: vi.fn(async ({ collection, where }: any) => {
      const docs = data[collection] || [];
      return { totalDocs: applyWhere(docs, where).length };
    }),

    login: vi.fn(async ({ collection, data: loginData }: any) => {
      const docs = data[collection] || [];
      const user = docs.find(
        (d) => String(d.email).toLowerCase() === String(loginData.email).toLowerCase()
      );
      if (!user) throw new Error("Invalid credentials");
      return { token: "mock-payload-token", user: deepClone(user) };
    }),

    auth: vi.fn(async ({ headers }: any) => {
      return { user: null };
    }),
  };

  return { payload, data };
}

function deepClone(obj: unknown): unknown {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Simplified where-clause evaluator.
 * Handles: equals, in, contains, like, greater_than_equal, less_than, and/or/not
 */
function applyWhere(docs: Record<string, unknown>[], where: any): Record<string, unknown>[] {
  if (!where || Object.keys(where).length === 0) return docs;

  return docs.filter((doc) => evaluateWhere(doc, where));
}

function evaluateWhere(doc: Record<string, unknown>, where: any): boolean {
  if (!where) return true;

  for (const [key, condition] of Object.entries(where)) {
    if (key === "and") {
      if (!(condition as any[]).every((c) => evaluateWhere(doc, c))) return false;
    } else if (key === "or") {
      if (!(condition as any[]).some((c) => evaluateWhere(doc, c))) return false;
    } else if (key === "not") {
      if (evaluateWhere(doc, condition)) return false;
    } else {
      // Field condition
      const fieldValue = getNestedValue(doc, key);
      const cond = condition as Record<string, unknown>;

      if (cond.equals !== undefined) {
        if (String(fieldValue) !== String(cond.equals)) return false;
      }
      if (cond.in !== undefined) {
        const arr = (cond.in as unknown[]).map(String);
        if (!arr.includes(String(fieldValue))) return false;
      }
      if (cond.contains !== undefined) {
        const val = String(fieldValue || "").toLowerCase();
        const search = String(cond.contains).toLowerCase();
        if (!val.includes(search)) return false;
      }
      if (cond.like !== undefined) {
        const val = String(fieldValue || "").toLowerCase();
        const search = String(cond.like).toLowerCase();
        if (!val.includes(search)) return false;
      }
      if (cond.greater_than_equal !== undefined) {
        const fv = toComparable(fieldValue);
        const cv = toComparable(cond.greater_than_equal);
        if (fv < cv) return false;
      }
      if (cond.less_than !== undefined) {
        const fv = toComparable(fieldValue);
        const cv = toComparable(cond.less_than);
        if (fv > cv) return false;
      }
    }
  }

  return true;
}

/**
 * Convert a value to a comparable form.
 * ISO date strings are converted to timestamps for proper comparison.
 */
function toComparable(value: unknown): number {
  if (value === null || value === undefined) return NaN;
  const str = String(value);
  // Detect ISO date strings (e.g. "2026-07-15T10:00:00.000Z")
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return new Date(str).getTime();
  }
  return Number(value);
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
