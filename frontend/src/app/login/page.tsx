"use client";

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Map, Sparkles, Lock, Mail } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    })

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const formDataBody = new URLSearchParams()
            formDataBody.append("username", formData.email)
            formDataBody.append("password", formData.password)

            const res = await fetch("http://localhost:8000/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formDataBody
            })

            if (!res.ok) throw new Error("Invalid credentials")

            const data = await res.json()

            // Set cookie (client-side for demo, ideally server-side or httpOnly)
            document.cookie = `token=${data.access_token}; path=/; max-age=1800` // 30 min

            toast.success("Welcome back!")
            router.push("/dashboard")

        } catch (error) {
            toast.error("Login failed. Check your credentials.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.15),transparent_50%)]"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl"></div>

            <Card className="w-full max-w-md bg-gray-900/50 border-gray-800 backdrop-blur-xl shadow-2xl relative z-10">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px] mb-2">
                        <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                            <Map className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">CareerCompass</CardTitle>
                    <CardDescription className="text-gray-400">Enter the future of career planning</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input
                                    className="pl-9 bg-gray-950/50 border-gray-800 text-white focus-visible:ring-purple-500"
                                    placeholder="Email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input
                                    className="pl-9 bg-gray-950/50 border-gray-800 text-white focus-visible:ring-purple-500"
                                    placeholder="Password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-10 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? <Sparkles className="w-4 h-4 animate-spin mr-2" /> : null}
                            {loading ? "Authenticating..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-gray-800 pt-6">
                    <p className="text-sm text-gray-400">
                        Don't have an account? <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">Sign up</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
