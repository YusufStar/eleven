import { betterFetch } from "@better-fetch/fetch";
import { NextRequest, NextResponse } from "next/server";
import { authClient } from "./lib/auth-client";

type Session = typeof authClient.$Infer.Session;

const authRoutes = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        headers: {
            cookie: request.headers.get("cookie") || "",
        },
    });
    
    if (authRoutes.includes(pathname)) {
        if (session) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        } else {
            return NextResponse.next();
        }
    } else if (pathname.startsWith("/dashboard")) {
        if (!session) {
            return NextResponse.redirect(new URL("/login", request.url));
        } else {
            return NextResponse.next();
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/signup"],
};