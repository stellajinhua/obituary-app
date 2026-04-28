"use client"
import { useState } from "react"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleLogin() {
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      window.location.href = "/"
    } else {
      setError("Wrong password")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-3">
      <input
        type="password"
        placeholder="Enter password"
        className="border p-2 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin} className="bg-black text-white px-4 py-2 rounded">
        Enter
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}