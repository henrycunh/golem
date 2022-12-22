import Prism from 'prismjs'

export default defineNuxtPlugin(async () => {
    console.log(Prism.languages)
    import('prismjs/components/prism-markdown')
    import('prismjs/components/prism-sql')
    import('prismjs/components/prism-python')
    import('prismjs/components/prism-markup-templating') // Without this, php just breaks the shit out of everything
    import('prismjs/components/prism-php')
    import('prismjs/components/prism-bash')
    import('prismjs/components/prism-yaml')
    import('prismjs/components/prism-docker')
    import('prismjs/components/prism-typescript')
    import('prismjs/components/prism-json')
    import('prismjs/components/prism-shell-session')
    import('prismjs/components/prism-css')
    import('prismjs/components/prism-c')
    // // Load languages
    // 'javascript',
    //     'typescript',
    //     'css',
    // 'markdown',
    //     'json',
    //     'md',
    //     'docker',
    //     'bash',
    //     'yaml',
    //     'sql',
    //     'python',
    //     'php',
    // ])
})
