"use client"

import { Suspense } from "react";
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
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FirstOrgCreate } from "@/components/auth/first-org-create";
import { useActiveOrgPaymentStatus } from "@/services/payments";
import { PlanDetailsCard } from "@/components/payment";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<Loading key="layout-loading" />}>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </Suspense>
    );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { isPending: isSessionPending } = authClient.useSession();
    const { isPending: isOrganizationsPending, data: organizations } = authClient.useListOrganizations();
    const { data: activeOrganization, isPending: isActiveOrganizationPending } = authClient.useActiveOrganization();
    const { data: activeOrgPaymentStatus } = useActiveOrgPaymentStatus(activeOrganization?.id ?? "");
    const pathname = usePathname();

    const breadcrumb = useMemo(() => {
        const paths = pathname.split("/").filter(Boolean);
        return paths.map((path, index) => ({
            label: path.charAt(0).toUpperCase() + path.slice(1),
            href: `/${paths.slice(0, index + 1).join("/")}`,
        }));
    }, [pathname])

    return (
        <div className="relative">
            <AnimatePresence>
                {(isSessionPending || isOrganizationsPending || isActiveOrganizationPending) ? <Loading key="loading" /> : organizations && organizations.length > 0 ? (
                    <SidebarProvider>
                        <AppSidebar />
                        <SidebarInset>
                            <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                                <div className="flex items-center gap-2 px-4">
                                    <SidebarTrigger className="-ml-1" />
                                    <Separator
                                        orientation="vertical"
                                        className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                                    />
                                    <Breadcrumb>
                                        <BreadcrumbList className="hidden md:flex">
                                            {breadcrumb.flatMap((item, index) => {
                                                const isLast = index === breadcrumb.length - 1;
                                                return [
                                                    <BreadcrumbItem key={item.href}>
                                                        {isLast ? (
                                                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                                        ) : (
                                                            <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                                                        )}
                                                    </BreadcrumbItem>,
                                                    ...(!isLast ? [<BreadcrumbSeparator key={`sep-${item.href}`} />] : []),
                                                ];
                                            })}
                                        </BreadcrumbList>
                                    </Breadcrumb>
                                </div>
                                <div className="flex items-center gap-2 px-4">
                                    <NotificationBell />
                                    <ThemeToggle />
                                </div>
                            </header>
                            <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-0">
                                {activeOrgPaymentStatus?.plan === "FREE" && !activeOrgPaymentStatus?.paidAt ? (
                                    <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
                                        {activeOrganization && <PlanDetailsCard organizationId={activeOrganization.id} />}
                                    </div>
                                ) : (
                                    <Suspense fallback={null}>
                                        {children}
                                    </Suspense>
                                )}
                            </div>
                        </SidebarInset>
                    </SidebarProvider>
                ) : <div className="h-screen w-full flex items-center justify-center">
                    <FirstOrgCreate />
                </div>}
            </AnimatePresence>
        </div>
    );
}