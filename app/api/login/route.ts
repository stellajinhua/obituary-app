import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { password } = await req.json()

  if (password === process.env.SITE_PASSWORD) {
    const res = NextResponse.json({ success: true })

    res.cookies.set("auth", "true", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // ⏱ 24 hours
    })

    return res
  }

  return new NextResponse("Unauthorized", { status: 401 })
}