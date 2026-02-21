"use client"

import { RefObject, useEffect, useRef } from "react"
import { motion } from "framer-motion"

export default function Loading() {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!ref.current) return;
        const svg = ref.current.querySelector("svg")
        svg?.classList.add("active")
    }, [ref])

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} ref={ref as RefObject<HTMLDivElement> | null} className="absolute inset-0 flex items-center justify-center h-screen bg-background z-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="size-20">
                <g transform="matrix(.495 0 0 .495 -118.2382 -144.218657)">
                    <path d="m294 292.36218h92c29.916 0 54 24.084 54 54v92c0 29.916-24.084 54-54 54h-92c-29.916 0-54-24.084-54-54v-92c0-29.916 24.084-54 54-54z" fill="var(--primary)" className="svg-elem-1"></path>
                    <g fill="var(--primary-foreground)">
                        <path d="m332 365.375-44 25v41c0 12.2037 9.84974 22.09375 22 22.09375 12.15027 0 22-9.89005 22-22.09375z" className="svg-elem-2"></path>
                        <path d="m310 335.375c-3.95946 0-7.66539 1.03623-10.875 2.875l-20.21875 11.625c-6.52053 3.83474-10.90625 10.95644-10.90625 19.09375 0 8.26131 4.31462 14.74083 11.00023 18.53215l52.99977-29.63872c0-12.20369-9.84973-22.48718-22-22.48718z" className="svg-elem-3"></path>
                        <g transform="translate(-.8)">
                            <path d="m404 365.375-44 25v41c0 12.2037 9.84974 22.09375 22 22.09375 12.15027 0 22-9.89005 22-22.09375z" className="svg-elem-4"></path>
                            <path d="m382 335.375c-3.95946 0-7.66539 1.03623-10.875 2.875l-20.21875 11.625c-6.52053 3.83474-10.90625 10.95644-10.90625 19.09375 0 8.26131 4.31462 14.74083 11.00023 18.53215l52.99977-29.63872c0-12.20369-9.84973-22.48718-22-22.48718z" className="svg-elem-5"></path>
                        </g>
                    </g>
                </g>
            </svg>
        </motion.div>
    )
}