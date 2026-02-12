import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const role = request.cookies.get('role')?.value
    const pathname = request.nextUrl.pathname

    // Protect dashboard and profile — require login
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        // Admin users cannot access regular dashboard or profile
        if (role === 'admin') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        }
    }

    // Protect admin routes — require login
    if (pathname.startsWith('/admin')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/profile/:path*', '/admin/:path*'],
}
