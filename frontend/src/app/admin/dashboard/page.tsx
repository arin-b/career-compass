"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { fetchClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Shield, User as UserIcon, Calendar, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface UserData {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
    display_name?: string;
    avatar_base64?: string;
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetchClient("/users/profile");
                if (!res.ok) {
                    router.push("/login");
                    return;
                }
                const profile = await res.json();
                if (profile.role !== "admin") {
                    toast.error("Unauthorized access.");
                    router.push("/dashboard");
                    return;
                }
                setIsAdmin(true);
                fetchUsers();
            } catch (error) {
                console.error("Auth check failed", error);
                router.push("/login");
            }
        };

        checkAuth();
    }, [router]);

    const fetchUsers = async () => {
        try {
            const res = await fetchClient("/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                toast.error("Failed to fetch users.");
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId: string, email: string) => {
        if (!confirm(`Are you sure you want to permanently delete user ${email}? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetchClient(`/admin/users/${userId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                toast.success("User deleted successfully.");
                setUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                toast.error("Failed to delete user.");
            }
        } catch (error) {
            console.error("Delete failed", error);
            toast.error("An error occurred.");
        }
    };

    if (!isAdmin) return null; // Or a loading spinner

    return (
        <div className="flex h-screen bg-black overflow-hidden font-sans text-white">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                                    Admin Dashboard
                                </h1>
                                <p className="text-gray-400 mt-1">Manage users and platform security</p>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg flex items-center gap-2 text-red-400">
                                <Shield className="w-4 h-4" />
                                <span className="text-sm font-semibold">Superuser Mode</span>
                            </div>
                        </div>

                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-white">Registered Users ({users.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-800 text-gray-400 text-sm">
                                                    <th className="p-4 font-medium">User</th>
                                                    <th className="p-4 font-medium">Email</th>
                                                    <th className="p-4 font-medium">Role</th>
                                                    <th className="p-4 font-medium">Joined</th>
                                                    <th className="p-4 font-medium text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {users.map((user) => (
                                                    <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center border border-gray-700">
                                                                    {user.avatar_base64 ? (
                                                                        <img src={user.avatar_base64} alt="Avatar" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <UserIcon className="w-4 h-4 text-gray-500" />
                                                                    )}
                                                                </div>
                                                                <span className="font-medium text-gray-200">{user.display_name || user.full_name || "Unknown"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-gray-400">
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="w-3 h-3" />
                                                                {user.email}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin'
                                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                                }`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-gray-500">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-3 h-3" />
                                                                {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            {user.role !== 'admin' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDelete(user.id, user.email)}
                                                                    className="text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
