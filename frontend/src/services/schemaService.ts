import apiClient from './apiClient';
import { FieldType } from '../lib/validation/isEmpty';

export interface RequiredWhenCondition {
    field: string;
    equals: unknown[];
    defaultsTo?: unknown;
}

export interface FieldRules {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    email?: boolean;
    options?: string[];
}

export interface FieldSchema {
    name: string;
    type: FieldType;
    required: boolean;
    requiredWhen?: RequiredWhenCondition[];
    rules: FieldRules;
}

export interface FormSchema {
    formKey: string;
    buildId: string;
    fields: FieldSchema[];
}

/**
 * In-memory schema cache, keyed by formKey.
 *
 * Deliberately not localStorage: schemas are static per deploy, and a schema
 * surviving across a deploy is exactly the staleness we want to avoid. A
 * page load starts cold, which is cheap and always correct.
 */
const cache = new Map<string, FormSchema>();
const inFlight = new Map<string, Promise<FormSchema | null>>();

/** buildId of the schemas currently cached; a change invalidates all of them. */
let cachedBuildId: string | null = null;

export function clearSchemaCache(): void {
    cache.clear();
    inFlight.clear();
    cachedBuildId = null;
}

/**
 * Fetches a form's schema, or returns null if it cannot be loaded.
 *
 * Returning null rather than throwing is deliberate: the schema is a UX
 * optimization, not the enforcement boundary. If it is unavailable the form
 * must still submit — the server validates regardless, and its errors are
 * mapped back onto the fields. A failed schema fetch degrades the experience;
 * it must never block the user.
 */
export async function fetchFormSchema(formKey: string): Promise<FormSchema | null> {
    const cached = cache.get(formKey);
    if (cached) return cached;

    const pending = inFlight.get(formKey);
    if (pending) return pending;

    const request = apiClient
        .get<FormSchema>(`/schema/${formKey}`)
        .then(({ data }) => {
            // A new deploy invalidates everything cached from the previous one.
            if (cachedBuildId && cachedBuildId !== data.buildId) {
                cache.clear();
            }
            cachedBuildId = data.buildId;
            cache.set(formKey, data);
            return data;
        })
        .catch(() => null)
        .finally(() => {
            inFlight.delete(formKey);
        });

    inFlight.set(formKey, request);
    return request;
}
