export default function trimIndent(content: string) {
    const lines = content.split('\n')
    const indent = lines.map(line => line.trimStart())
    return indent.join('\n')
}
