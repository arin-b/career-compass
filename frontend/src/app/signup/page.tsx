"use client";

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Map, Sparkles, Lock, Mail, User, GraduationCap } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SignupPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        full_name: "",
        academic_level: "Undergraduate"
    })

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch("https://career-compass-backend-hf0w.onrender.com/api/v1/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.detail || "Signup failed")
            }

            toast.success("Account created! Please log in.")
            router.push("/login")

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(236,72,153,0.1),transparent_50%)]"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl"></div>

            <Card className="w-full max-w-md bg-gray-900/50 border-gray-800 backdrop-blur-xl shadow-2xl relative z-10">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px] mb-2">
                        <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                            <Map className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
                    <CardDescription className="text-gray-400">Start your journey with CareerCompass</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input
                                    className="pl-9 bg-gray-950/50 border-gray-800 text-white focus-visible:ring-purple-500"
                                    placeholder="Full Name"
                                    required
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                        </div>
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
                                <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-500 z-10" />
                                <Select
                                    onValueChange={val => setFormData({ ...formData, academic_level: val })}
                                    defaultValue={formData.academic_level}
                                >
                                    <SelectTrigger className="pl-9 bg-gray-950/50 border-gray-800 text-white focus:ring-purple-500 w-full">
                                        <SelectValue placeholder="Academic Level" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-900 border-gray-700 text-white">
                                        <SelectItem value="HighSchool">High School</SelectItem>
                                        <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                                        <SelectItem value="Graduate">Graduate</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
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
                            {loading ? "Creating Account..." : "Sign Up"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-gray-800 pt-6">
                    <p className="text-sm text-gray-400">
                        Already have an account? <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">Log in</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
