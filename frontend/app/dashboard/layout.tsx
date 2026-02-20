"use client"

import Loading from "@/components/loading";
import { AppSidebar } from "@/components/layout/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [loading, setLoading] = useState(true)

    const breadcrumb = useMemo(() => {
        const paths = pathname.split("/").filter(Boolean);
        return paths.map((path, index) => ({
            label: path.charAt(0).toUpperCase() + path.slice(1),
            href: `/${paths.slice(0, index + 1).join("/")}`,
        }));
    }, [pathname])

    useEffect(() => {
        setTimeout(() => {
            setLoading(false)
        }, 3000)
    }, [])

    return (
        <div className="relative">
            <AnimatePresence>
                {loading ? <Loading key="loading" /> : (
                    <SidebarProvider>
                        <AppSidebar />
                        <SidebarInset>
                            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                                <div className="flex items-center gap-2 px-4">
                                    <SidebarTrigger className="-ml-1" />
                                    <Separator
                                        orientation="vertical"
                                        className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                                    />
                                    <Breadcrumb>
                                        <BreadcrumbList>
                                            <BreadcrumbItem className="hidden md:block">
                                                {breadcrumb.map((item) => (
                                                    <BreadcrumbLink key={item.href} href={item.href}>
                                                        {item.label}
                                                    </BreadcrumbLink>
                                                ))}
                                            </BreadcrumbItem>
                                            {breadcrumb.length > 1 && (
                                                <>
                                                    <BreadcrumbSeparator className="hidden md:block" />
                                                    <BreadcrumbItem>
                                                        <BreadcrumbPage>{breadcrumb[breadcrumb.length - 1].label}</BreadcrumbPage>
                                                    </BreadcrumbItem>
                                                </>
                                            )}
                                        </BreadcrumbList>
                                    </Breadcrumb>
                                </div>
                            </header>
                            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                                {children}
                            </div>
                        </SidebarInset>
                    </SidebarProvider>
                )}
            </AnimatePresence>
        </div>
    );
}