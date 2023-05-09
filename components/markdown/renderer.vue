<script lang="ts">
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import type { Content, Root } from 'mdast'
import type { Lang } from 'shiki-es'
import GoLink from '../go/link.vue'
import Paragraph from './paragraph.vue'
import Heading from './heading.vue'
import CodeBlock from './code-block.vue'
import CodeInline from './code-inline.vue'
import UnorderedList from './unordered-list.vue'

export default defineComponent({
    props: {
        value: {
            type: String,
            required: true,
        },
    },
    render(ctx: any) {
        const { value } = ctx
        // Get the Markdown AST
        const ast = remark()
            .use(remarkGfm)
            .parse(value)

        // Render AST to components
        const render = (node: Content | Root): any => {
            if (node.type === 'root') {
                return h('div', node.children.map(render))
            }
            if (node.type === 'heading') {
                return h(Heading, { depth: node.depth }, () => node.children.map(render))
            }
            if (node.type === 'paragraph') {
                return h(Paragraph, {}, () => node.children.map(render))
            }
            if (node.type === 'list') {
                return h(UnorderedList, {}, () => node.children.map(render))
            }
            if (node.type === 'listItem') {
                return h('li', node.children.map(render))
            }
            if (node.type === 'table') {
                return h('table', node.children.map(render))
            }
            if (node.type === 'tableRow') {
                return h('tr', node.children.map(render))
            }
            if (node.type === 'tableCell') {
                return h('td', node.children.map(render))
            }
            if (node.type === 'code') {
                const lang = (node.lang as Lang) || 'md'
                return h(CodeBlock, { content: node.value, syntax: lang }, () => node.value)
            }
            if (node.type === 'strong') {
                return h('strong', node.children.map(render))
            }
            if (node.type === 'emphasis') {
                return h('em', node.children.map(render))
            }
            if (node.type === 'blockquote') {
                return h('blockquote', node.children.map(render))
            }
            if (node.type === 'text') {
                return h('span', node.value)
            }
            if (node.type === 'link') {
                return h(GoLink, { to: node.url }, () => node.children.map(render))
            }
            if (node.type === 'image') {
                return h('img', { src: node.url })
            }
            if (node.type === 'inlineCode') {
                return h(CodeInline, {}, () => node.value)
            }
            if (node.type === 'break') {
                return h('br')
            }
            if (node.type === 'thematicBreak') {
                return h('hr')
            }
            if (node.type === 'html') {
                return h('div', node.value)
            }
            return h('div', node)
        }

        return render(ast)
    },
})
</script>
