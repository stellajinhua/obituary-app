"use client"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {

  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [show, setShow] = useState(false)

async function handleLogin() {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  })

  if (res.ok) {
    window.location.href = "/"
  } else {
    setError("Wrong password")
  }
}

 return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">

    <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-sm space-y-6">

      {/* Title */}
      <div className="text-center space-y-1">
        <h1 className="text-xl font-semibold text-gray-800">
          Private Access
        </h1>
        <p className="text-sm text-gray-500">
          Enter password to continue
        </p>
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder="Enter access password"
          className="w-full border border-gray-300 p-2 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin()
          }}
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Button */}
      <button
        onClick={handleLogin}
        disabled={!password.trim()}
        className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Enter
      </button>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 text-center">
          {error}
        </p>
      )}

      {/* Subtle branding */}
      <p className="text-xs text-gray-400 text-center">
        Secure access portal
      </p>

    </div>
  </div>
)
}