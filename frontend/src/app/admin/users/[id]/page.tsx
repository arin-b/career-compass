"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoadmapDisplay, type MilestoneData } from "@/components/RoadmapDisplay";
import {
    ArrowLeft,
    Mail,
    Shield,
    Calendar,
    User as UserIcon,
    BookOpen,
    GraduationCap,
    FileText,
    Map,
    Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface UserFullDetails {
    user: {
        id: string;
        email: string;
        full_name: string;
        role: string;
        created_at: string;
        display_name?: string;
        avatar_base64?: string;
    };
    profile: {
        bio?: string;
        hobbies: string[];
        extracurriculars: string[];
        manual_gpa?: number;
        manual_major?: string;
        transcript_summary?: string;
        transcript_metadata: any[];
        additional_context?: string;
    } | null;
    roadmap: {
        roadmap_id: string;
        title: string;
        description?: string;
        status?: string;
        created_at?: string;
        content: {
            milestones: any[];
            [key: string]: any;
        };
    } | null;
}

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<UserFullDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const init = async () => {
            // Auth check
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
            } catch {
                router.push("/login");
                return;
            }

            // Fetch user details
            try {
                const res = await fetchClient(`/admin/users/${params.id}/full-details`);
                if (!res.ok) {
                    toast.error("Failed to fetch user details.");
                    router.push("/admin/dashboard");
                    return;
                }
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error("Error fetching user details:", error);
                toast.error("An error occurred.");
                router.push("/admin/dashboard");
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [params.id, router]);

    if (!isAdmin || loading) {
        return (
            <div className="flex h-screen bg-black text-white items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-500 mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold mb-2">Loading User Details</h2>
                    <p className="text-gray-400">Fetching profile and roadmap data...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { user, profile, roadmap } = data;

    // Convert roadmap milestones to the format expected by RoadmapDisplay
    const milestones: MilestoneData[] = roadmap?.content?.milestones?.map((m: any, index: number) => ({
        id: m.id ? String(m.id) : undefined,
        title: m.title,
        semester: m.semester,
        status: m.status || "Pending",
        desc: m.description || "",
        active: index === 0,
        projects: m.projects,
        skills: m.skills,
        completed: m.status === "Done",
    })) || [];

    return (
        <div className="flex h-screen bg-black overflow-hidden font-sans text-white">
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-md px-8 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/admin/dashboard")}
                            className="text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 p-[2px]">
                            <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                                <Map className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                            User Details
                        </span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-5xl mx-auto space-y-8">
                        {/* User Info Header */}
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center border-2 border-gray-600 shadow-lg">
                                    {user.avatar_base64 ? (
                                        <img src={user.avatar_base64} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-10 h-10 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold text-gray-100">
                                        {user.display_name || user.full_name || "Unknown User"}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 mt-3">
                                        <span className="flex items-center gap-2 text-gray-400 text-sm">
                                            <Mail className="w-4 h-4" />
                                            {user.email}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === "admin"
                                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                            }`}>
                                            <Shield className="w-3 h-3 inline mr-1" />
                                            {user.role}
                                        </span>
                                        <span className="flex items-center gap-2 text-gray-500 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            Joined {user.created_at ? format(new Date(user.created_at), "MMMM d, yyyy") : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section A: Profile Snapshot */}
                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-orange-400" />
                                    Profile Snapshot
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {!profile ? (
                                    <p className="text-gray-500 italic">No profile data available for this user.</p>
                                ) : (
                                    <>
                                        {/* Bio */}
                                        {profile.bio && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Bio</h4>
                                                <p className="text-gray-300 leading-relaxed bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                                    {profile.bio}
                                                </p>
                                            </div>
                                        )}

                                        {/* Academic Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {profile.manual_major && (
                                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                        <GraduationCap className="w-4 h-4 text-blue-400" />
                                                        Major
                                                    </h4>
                                                    <p className="text-gray-200 font-medium text-lg">{profile.manual_major}</p>
                                                </div>
                                            )}
                                            {profile.manual_gpa !== null && profile.manual_gpa !== undefined && (
                                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                        <Briefcase className="w-4 h-4 text-green-400" />
                                                        GPA
                                                    </h4>
                                                    <p className="text-gray-200 font-medium text-lg">{profile.manual_gpa}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Hobbies */}
                                        {profile.hobbies.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Hobbies</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.hobbies.map((h, i) => (
                                                        <span key={i} className="px-3 py-1.5 bg-purple-500/15 text-purple-300 border border-purple-500/25 rounded-full text-sm font-medium">
                                                            {h}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Extracurriculars */}
                                        {profile.extracurriculars.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Extracurriculars</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.extracurriculars.map((e, i) => (
                                                        <span key={i} className="px-3 py-1.5 bg-blue-500/15 text-blue-300 border border-blue-500/25 rounded-full text-sm font-medium">
                                                            {e}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Transcripts */}
                                        {profile.transcript_metadata.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-orange-400" />
                                                    Uploaded Transcripts
                                                </h4>
                                                <div className="space-y-2">
                                                    {profile.transcript_metadata.map((t: any, i: number) => (
                                                        <div key={i} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                                                            <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                                                            <span className="text-gray-300 text-sm">{t.filename || t.name || `Transcript ${i + 1}`}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Additional Context */}
                                        {profile.additional_context && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Additional Context</h4>
                                                <p className="text-gray-300 leading-relaxed bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                                    {profile.additional_context}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Section B: Roadmap View */}
                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Map className="w-5 h-5 text-orange-400" />
                                    Career Roadmap
                                    {roadmap && (
                                        <span className="text-sm font-normal text-gray-500 ml-2">
                                            — {roadmap.title}
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!roadmap ? (
                                    <p className="text-gray-500 italic text-center py-8">
                                        This user has not generated a roadmap yet.
                                    </p>
                                ) : (
                                    <RoadmapDisplay
                                        milestones={milestones}
                                        readOnly={true}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
