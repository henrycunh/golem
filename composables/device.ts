import { breakpointsTailwind } from '@vueuse/core'
export function useDevice() {
    const breakpoint = useBreakpoints(breakpointsTailwind)

    const isSmallDesktop = breakpoint.smallerOrEqual('lg')
    const isMobile = breakpoint.smallerOrEqual('sm')

    const isMobileSafari = (() => {
        const headers = (
            process.server
                ? useRequestHeaders()['user-agent']
                : navigator.userAgent
        ) || ''
        return headers.includes('iPhone') || headers.includes('iPad')
    })()

    return {
        isMobile,
        isSmallDesktop,
        isMobileSafari,
    }
}
