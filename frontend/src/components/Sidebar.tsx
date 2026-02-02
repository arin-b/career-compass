"use client";

import { useEffect, useState } from "react";
import { Map, User, ChevronRight, GraduationCap, BookOpen, Shield, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetchClient } from "@/lib/api";

export const Sidebar = () => {
    const [profile, setProfile] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetchClient("/users/profile").then(async res => {
            if (res.ok) setProfile(await res.json());
        });
    }, []);

    const major = profile?.manual_major || "Computer Science (Default)";
    const gpa = profile?.manual_gpa || "3.8 (Default)";
    const name = profile?.display_name || "Alex H.";
    const avatar = profile?.avatar_base64;
    const role = profile?.role;

    const handleLogout = () => {
        document.cookie = "token=; path=/; max-age=0";
        toast.success("Logged out successfully.");
        router.push("/login");
    };

    return (
        <div className="w-64 bg-gray-900 text-white flex flex-col h-full border-r border-gray-800 shrink-0">
            <div className="p-6 border-b border-gray-800 flex items-center gap-2 cursor-pointer" onClick={() => router.push("/dashboard")}>
                <Map className="w-6 h-6 text-purple-400" />
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    CareerCompass
                </span>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                            {avatar ? (
                                <img src={avatar} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 text-white" />
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-medium text-lg truncate w-32" title={name}>{name}</h3>
                        <a href="/profile" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                            Edit Profile <ChevronRight className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                <div className="space-y-4">
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <GraduationCap className="w-4 h-4 text-purple-400" />
                                <span className="truncate" title={major}>{major}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <BookOpen className="w-4 h-4 text-blue-400" />
                                <span>GPA: {gpa}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {role === 'admin' && (
                        <Button
                            variant="outline"
                            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 justify-start gap-2"
                            onClick={() => router.push("/admin/dashboard")}
                        >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                        </Button>
                    )}
                </div>
            </div>
            <div className="mt-auto p-6 space-y-4">
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800 gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </Button>
                <div className="text-xs text-gray-600 text-center">
                    v0.2.0 Beta
                </div>
            </div>
        </div>
    )
}
