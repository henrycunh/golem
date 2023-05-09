export default function mapValue(map: Record<string, any>, value: string, defaultValue?: any) {
    if (value in map) {
        return map[value]
    }
    else {
        return defaultValue
    }
}
