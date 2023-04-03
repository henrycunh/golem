import { breakpointsTailwind } from '@vueuse/core'
export function useDevice() {
    const breakpoint = useBreakpoints(breakpointsTailwind)

    const isMobile = breakpoint.smallerOrEqual('sm')

    return {
        isMobile,
    }
}
