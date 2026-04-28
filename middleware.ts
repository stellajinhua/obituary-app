import { NextResponse } from "next/server"

export function middleware(req) {
  const isLoggedIn = req.cookies.get("auth")

  const pathname = req.nextUrl.pathname

  const isLoginPage = pathname === "/login"
  const isApi = pathname.startsWith("/api")
  const isNext = pathname.startsWith("/_next")
  const isStatic = pathname.includes(".") // files like .js, .css, .png

  if (!isLoggedIn && !isLoginPage && !isApi && !isNext && !isStatic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}