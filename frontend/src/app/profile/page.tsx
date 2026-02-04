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
import { ArrowLeft, Save, Sparkles, User, GraduationCap, FileText, Plus, RefreshCw, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const UploadSection = ({ hasFiles, onSuccess }: { hasFiles: boolean, onSuccess: () => void }) => {
    const [mode, setMode] = useState<"replace" | "append">(hasFiles ? "append" : "replace");

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <Button
                    variant={mode === "replace" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("replace")}
                    className={mode === "replace" ? "bg-red-900/50 hover:bg-red-900 border-red-700 text-red-100" : "border-gray-800 text-gray-400"}
                >
                    <RefreshCw className="w-3 h-3 mr-1" /> Replace All
                </Button>
                <Button
                    variant={mode === "append" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("append")}
                    className={mode === "append" ? "bg-purple-900/50 hover:bg-purple-900 border-purple-700 text-purple-100" : "border-gray-800 text-gray-400"}
                >
                    <Plus className="w-3 h-3 mr-1" /> Add/Append
                </Button>
            </div>

            <FileUpload
                mode={mode}
                onUploadSuccess={() => {
                    toast.success(`Transcript uploaded (${mode} mode)!`);
                    onSuccess();
                }}
            />
            <p className="text-[10px] text-gray-500 text-center">
                {mode === "replace" ? "⚠️ This will remove all previous transcripts." : "✨ Adds to your existing academic record."}
            </p>
        </div>
    );
};

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        manual_major: "",
        manual_gpa: "",
        bio: "",
        hobbies: [] as string[],
        extracurriculars: [] as string[],
        display_name: "",
        avatar_base64: "",
        additional_context: "",
        transcript_metadata: [] as { name: string, date: string }[]
    });

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [transcriptToDelete, setTranscriptToDelete] = useState<string | null>(null);

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
                        avatar_base64: data.avatar_base64 || "",
                        additional_context: data.additional_context || "",
                        transcript_metadata: data.transcript_metadata || []
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

    const handleDeleteTranscript = async () => {
        if (!transcriptToDelete) return;

        try {
            const res = await fetchClient("/users/profile/transcript", {
                method: "DELETE",
                body: JSON.stringify({ filename: transcriptToDelete })
            });

            if (res.ok) {
                // Remove from local state
                setFormData(prev => ({
                    ...prev,
                    transcript_metadata: prev.transcript_metadata.filter(
                        meta => meta.name !== transcriptToDelete
                    )
                }));
                toast.success("Transcript deleted successfully!");
            } else {
                toast.error("Failed to delete transcript");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete transcript");
        } finally {
            setDeleteDialogOpen(false);
            setTranscriptToDelete(null);
        }
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
                // Just send user_id, backend fetches the rest from the profile we just saved.
                const genRes = await fetchClient("/roadmaps/generate", {
                    method: "POST",
                    body: JSON.stringify({
                        user_id: "7dd566d5-5571-40f6-b913-e5e681ea0cb1" // TODO: Use actual user ID from context/auth
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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 text-gray-900 dark:text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.push("/dashboard")} className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
                    </Button>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 dark:from-purple-400 dark:via-blue-400 dark:to-green-400">
                        Your Profile
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Avatar and Basic Info */}
                    <div className="space-y-6">

                        {/* Avatar Card */}
                        <Card className="bg-white/80 dark:bg-gray-800/80 border-purple-200 dark:border-purple-800 shadow-xl backdrop-blur-sm flex flex-col items-center p-8 text-center rounded-2xl min-h-[320px]">
                            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gradient-to-r from-purple-500 to-blue-500 mb-6 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-gray-700 dark:to-gray-600 items-center justify-center flex shadow-lg">
                                {formData.avatar_base64 ? (
                                    <img src={formData.avatar_base64} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                                )}
                            </div>
                            <label className="cursor-pointer text-lg font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
                                Change Photo
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </label>
                            <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Max 200KB</span>
                        </Card>

                        <Card className="bg-white/80 dark:bg-gray-800/80 border-blue-200 dark:border-blue-800 shadow-xl backdrop-blur-sm rounded-2xl min-h-[320px]">
                            <CardHeader>
                                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                                    Identity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Display Name</label>
                                    <Input
                                        placeholder="Alex Hamilton"
                                        className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl h-12 text-lg"
                                        value={formData.display_name}
                                        onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Personal Bio</label>
                                    <Textarea
                                        placeholder="Tell us about your goals..."
                                        className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl min-h-[120px] text-lg"
                                        value={formData.bio}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* Right Column: Major/GPA and Transcript */}
                    <div className="space-y-6">
                        <Card className="bg-white/80 dark:bg-gray-800/80 border-yellow-200 dark:border-yellow-800 shadow-xl backdrop-blur-sm rounded-2xl min-h-[320px]">
                            <CardContent className="space-y-6 p-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Major</label>
                                        <Input
                                            placeholder="e.g. Computer Science"
                                            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl h-12 text-lg"
                                            value={formData.manual_major}
                                            onChange={e => setFormData({ ...formData, manual_major: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">GPA</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g. 3.8"
                                            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl h-12 text-lg"
                                            value={formData.manual_gpa}
                                            onChange={e => setFormData({ ...formData, manual_gpa: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/80 dark:bg-gray-800/80 border-green-200 dark:border-green-800 shadow-xl backdrop-blur-sm rounded-2xl min-h-[320px]">
                            <CardHeader>
                                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                                    <FileText className="w-6 h-6 text-green-600 dark:text-green-400" /> Transcript
                                </CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400">Upload your PDF here</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {formData.transcript_metadata && formData.transcript_metadata.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm font-medium text-gray-300">Uploaded Files:</p>
                                        <ul className="space-y-1">
                                            {formData.transcript_metadata.map((file, idx) => (
                                                <li key={idx} className="text-xs flex items-center gap-2 text-gray-400 bg-gray-950 p-2 rounded border border-gray-800">
                                                    <FileText className="w-3 h-3 text-purple-400" />
                                                    <span className="truncate flex-1">{file.name}</span>
                                                    <span className="text-gray-600">{new Date(file.date).toLocaleDateString()}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 ml-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                                                        onClick={() => {
                                                            setTranscriptToDelete(file.name);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <FileUpload
                                        mode={formData.transcript_metadata.length > 0 ? "append" : "replace"}
                                        onUploadSuccess={(txt) => {
                                            toast.success("Transcript uploaded!");
                                            window.location.reload();
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Full Width: Interests & Activities */}
                <div className="mt-8">
                    <Card className="bg-white/80 dark:bg-gray-800/80 border-pink-200 dark:border-pink-800 shadow-xl backdrop-blur-sm rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2 text-xl">
                                <Sparkles className="w-6 h-6 text-yellow-500" /> Interests & Activities
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-lg font-semibold text-gray-700 dark:text-gray-300">Hobbies</label>
                                    <TagInput
                                        placeholder="Type hobby and press Enter..."
                                        value={formData.hobbies}
                                        onChange={tags => setFormData({ ...formData, hobbies: tags })}
                                    />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">e.g. Chess, Painting, Hiking</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-lg font-semibold text-gray-700 dark:text-gray-300">Extracurriculars</label>
                                    <TagInput
                                        placeholder="Type activity and press Enter..."
                                        value={formData.extracurriculars}
                                        onChange={tags => setFormData({ ...formData, extracurriculars: tags })}
                                    />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">e.g. Debate Club, Robotics Team</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-lg font-semibold text-gray-700 dark:text-gray-300">Additional Context</label>
                                <Textarea
                                    placeholder="Is there anything else you want to tell us? (Specific career goals, constraints, dreams, etc.)"
                                    className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl min-h-[150px] text-lg"
                                    value={formData.additional_context}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, additional_context: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-6 pt-6">
                        <Button
                            variant="outline"
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-8 py-3 text-lg rounded-xl"
                        >
                            <Save className="w-5 h-5 mr-2" /> Save Changes
                        </Button>
                        <Button
                            onClick={() => handleSave(true)}
                            disabled={saving}
                            className="bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 hover:from-purple-700 hover:via-blue-700 hover:to-green-700 text-white shadow-xl shadow-purple-500/30 px-8 py-3 text-lg rounded-xl"
                        >
                            {saving ? <Sparkles className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                            Save & Recalculate Roadmap
                        </Button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">Delete Transcript</DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400">
                            Are you sure you want to delete "{transcriptToDelete}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteTranscript}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
