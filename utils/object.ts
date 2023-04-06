export function omitKeys<T extends Record<PropertyKey, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = {} as Omit<T, K>
    for (const [key, value] of Object.entries(obj)) {
        if (!keys.includes(key as unknown as K)) {
            result[key as Exclude<keyof T, K>] = value as T[Exclude<keyof T, K>]
        }
    }
    return result
}

// Makes any non-object, non-array or non-primitive a string (e.g. Date)
export function pruneObject<T extends Record<PropertyKey, unknown>>(obj: T): T {
    const result = {} as T
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            result[key as keyof T] = pruneObject(value as unknown as Record<PropertyKey, unknown>) as T[keyof T]
        }
        else {
            result[key as keyof T] = value as T[keyof T]
        }
    }
    return result
}

export function parseDateFields<T extends object, U extends ReadonlyArray<string>>(obj: T, fields: U):
{
    [K in keyof T]: K extends Extract<K, U[number]> ? Date : T[K]
} {
    const result = {} as any
    for (const [key, value] of Object.entries(obj)) {
        if (fields.includes(key as unknown as U[number])) {
            result[key as U[number]] = new Date(value as unknown as string)
        }
        else {
            result[key as U[number]] = value as T[keyof T]
        }
    }
    return result as {
        [K in keyof T]: K extends Extract<K, U[number]> ? Date : T[K]
    }
}
