import { breakpointsTailwind } from '@vueuse/core'
export function useDevice() {
    const breakpoint = useBreakpoints(breakpointsTailwind)

    const isSmallDesktop = breakpoint.smallerOrEqual('lg')
    const isMobile = breakpoint.smallerOrEqual('sm')

    return {
        isMobile,
        isSmallDesktop,
    }
}
