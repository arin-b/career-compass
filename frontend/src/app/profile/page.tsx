"use client";

import { useEffect, useState } from "react";
import { fetchClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TagInput } from "@/components/ui/tag-input";
import { FileUpload } from "@/components/file-upload";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Sparkles, User, GraduationCap, FileText } from "lucide-react";

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile State
    const [formData, setFormData] = useState({
        manual_major: "",
        manual_gpa: "",
        bio: "",
        hobbies: [] as string[],
        extracurriculars: [] as string[],
        display_name: "",
        avatar_base64: ""
    });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await fetchClient("/users/profile");
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        manual_major: data.manual_major || "",
                        manual_gpa: data.manual_gpa ? data.manual_gpa.toString() : "",
                        bio: data.bio || "",
                        hobbies: data.hobbies || [],
                        extracurriculars: data.extracurriculars || [],
                        display_name: data.display_name || "",
                        avatar_base64: data.avatar_base64 || ""
                    });
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > 200 * 1024) { // 200KB
            toast.error("Image too large! Max 200KB.");
            return;
        }
        if (!file.type.startsWith("image/")) {
            toast.error("Only images allowed.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setFormData(prev => ({ ...prev, avatar_base64: base64String }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (recalculate: boolean = false) => {
        setSaving(true);
        try {
            const payload = {
                ...formData,
                manual_gpa: formData.manual_gpa ? parseFloat(formData.manual_gpa) : null
            };

            const res = await fetchClient("/users/profile", {
                method: "PUT",
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save profile");

            toast.success("Profile saved!");

            if (recalculate) {
                toast.info("Regenerating roadmap...");
                // Trigger generation
                // We pass "uploadedTranscript: true" equivalent logic if we want, or just empty params relying on backend precedence
                // The backend uses Profile data if payload is empty/default.
                const genRes = await fetchClient("/roadmaps/generate", {
                    method: "POST",
                    body: JSON.stringify({
                        user_id: "7dd566d5-5571-40f6-b913-e5e681ea0cb1", // Mock ID or fetch from context 
                        interests: ["Software Engineering"], // Ideally this comes from DB too
                        transcript_summary: "No transcript provided" // Forces backend to look up profile
                    })
                });

                if (!genRes.ok) throw new Error("Recalculation failed");

                toast.success("Roadmap updated!");
                router.push("/dashboard");
            }

        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading Profile...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Your Profile
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Col: Avatar, Upload & Basic Info */}
                    <div className="space-y-6 md:col-span-1">

                        {/* Avatar Card */}
                        <Card className="bg-gray-900 border-gray-800 flex flex-col items-center p-6 text-center">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500/30 mb-4 bg-gray-800 items-center justify-center flex">
                                {formData.avatar_base64 ? (
                                    <img src={formData.avatar_base64} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-gray-500" />
                                )}
                            </div>
                            <label className="cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
                                Change Photo
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </label>
                            <span className="text-xs text-gray-500 mt-1">Max 200KB</span>
                        </Card>

                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2 text-base">
                                    Identity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Display Name</label>
                                    <Input
                                        placeholder="Alex Hamilton"
                                        className="bg-gray-950 border-gray-700 text-white"
                                        value={formData.display_name}
                                        onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Personal Bio</label>
                                    <Textarea
                                        placeholder="Tell us about your goals..."
                                        className="bg-gray-950 border-gray-700 text-white min-h-[100px]"
                                        value={formData.bio}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-400" /> Transcript
                                </CardTitle>
                                <CardDescription className="text-gray-400">Upload your PDF here</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FileUpload onUploadSuccess={(txt) => toast.success("Transcript uploaded and ready!")} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Col: Academic & Interests */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-green-400" /> Academic Override
                                </CardTitle>
                                <CardDescription className="text-gray-400">
                                    Manually enter data here to override transcript extraction.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Major</label>
                                        <Input
                                            placeholder="e.g. Computer Science"
                                            className="bg-gray-950 border-gray-700 text-white"
                                            value={formData.manual_major}
                                            onChange={e => setFormData({ ...formData, manual_major: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">GPA</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g. 3.8"
                                            className="bg-gray-950 border-gray-700 text-white"
                                            value={formData.manual_gpa}
                                            onChange={e => setFormData({ ...formData, manual_gpa: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-900 border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-yellow-400" /> Interests & Activities
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Hobbies</label>
                                    <TagInput
                                        placeholder="Type hobby and press Enter..."
                                        value={formData.hobbies}
                                        onChange={tags => setFormData({ ...formData, hobbies: tags })}
                                    />
                                    <p className="text-xs text-gray-500">e.g. Chess, Painting, Hiking</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Extracurriculars</label>
                                    <TagInput
                                        placeholder="Type activity and press Enter..."
                                        value={formData.extracurriculars}
                                        onChange={tags => setFormData({ ...formData, extracurriculars: tags })}
                                    />
                                    <p className="text-xs text-gray-500">e.g. Debate Club, Robotics Team</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                className="border-gray-700 text-gray-300 hover:text-white"
                            >
                                <Save className="w-4 h-4 mr-2" /> Save Changes
                            </Button>
                            <Button
                                onClick={() => handleSave(true)}
                                disabled={saving}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20"
                            >
                                {saving ? <Sparkles className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Save & Recalculate Roadmap
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
