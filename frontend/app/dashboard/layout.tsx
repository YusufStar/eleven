"use client"

import Loading from "@/components/loading";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setTimeout(() => {
            setLoading(false)
        }, 3000)
    }, [])

    return (
        <div className="relative">
            <AnimatePresence>
                {loading ? <Loading key="loading" /> : (
                    <>
                        {children}
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}