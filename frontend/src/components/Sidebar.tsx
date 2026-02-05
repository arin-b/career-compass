"use client";

import { useEffect, useState } from "react";
import { Map, User, ChevronRight, GraduationCap, BookOpen, Shield, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetchClient } from "@/lib/api";
import { ThemeToggle } from "./ThemeToggle";

export const Sidebar = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchClient("/users/profile").then(async res => {
            if (res.ok) setProfile(await res.json());
            setLoading(false);
        });
    }, []);

    const major = profile?.manual_major || "Computer Science (Default)";
    const gpa = profile?.manual_gpa || "3.8 (Default)";
    const name = profile?.display_name || "";
    const avatar = profile?.avatar_base64;
    const role = profile?.role;

    const handleLogout = () => {
        document.cookie = "token=; path=/; max-age=0";
        toast.success("Logged out successfully.");
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="w-72 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-white flex flex-col h-full border-r border-gray-200 dark:border-gray-700 shrink-0 shadow-xl items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-72 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-white flex flex-col h-full border-r border-gray-200 dark:border-gray-700 shrink-0 shadow-xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" onClick={() => router.push("/dashboard")}>
                <Map className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 dark:from-purple-400 dark:via-blue-400 dark:to-green-400">
                    CareerCompass
                </span>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 via-blue-500 to-green-500 p-[3px] shadow-lg">
                        <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                            {avatar ? (
                                <img src={avatar} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-xl truncate w-36" title={name}>{name}</h3>
                        <a href="/profile" className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 transition-colors">
                            Edit Profile <ChevronRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>

                <div className="space-y-4">
                    <Card className="bg-white/80 dark:bg-gray-700/80 border-gray-200 dark:border-gray-600 shadow-lg backdrop-blur-sm">
                        <CardContent className="p-5 space-y-3">
                            <div className="flex items-center gap-3 text-base text-gray-700 dark:text-gray-300">
                                <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <span className="truncate font-medium" title={major}>{major}</span>
                            </div>
                            <div className="flex items-center gap-3 text-base text-gray-700 dark:text-gray-300">
                                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <span className="font-medium">GPA: {gpa}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {role === 'admin' && (
                        <Button
                            variant="outline"
                            className="w-full border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 justify-start gap-3 px-4 py-3 text-base rounded-xl"
                            onClick={() => router.push("/admin/dashboard")}
                        >
                            <Shield className="w-5 h-5" />
                            Admin Panel
                        </Button>
                    )}
                </div>
            </div>
            <div className="mt-auto p-6 space-y-4">
                <div className="flex justify-center">
                    <ThemeToggle />
                </div>
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 gap-3 px-4 py-3 text-base rounded-xl"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </Button>
                <div className="text-sm text-gray-500 dark:text-gray-600 text-center bg-gray-100 dark:bg-gray-800/50 py-2 px-4 rounded-xl">
                    v0.2.0 Beta
                </div>
            </div>
        </div>
    )
}
