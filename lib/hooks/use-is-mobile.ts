import { useEffect, useState } from "react";

export function useIsMobile(breakpoint: number = 768): boolean {
    const [isMobile, setIsMobile] = useState(false); // Always start with false to avoid hydration mismatch

    useEffect(() => {
        function handleResize() {
            setIsMobile(window.innerWidth <= breakpoint);
        }

        // Set initial value on mount
        handleResize();

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [breakpoint]);

    return isMobile;
} 