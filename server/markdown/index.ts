export function splitMarkdownByHeadingLevel(content: string, level: number) {
    const headingRegex = new RegExp(`^#{${level}} `, 'gm')
    const sections = content
        .split(headingRegex)
        .filter(Boolean)
        .map(section => section.trim())
    return sections
}
