"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Send, User, Bot, Sparkles, ChevronLeft, ChevronRight, GraduationCap, Map, BookOpen, Clock, Upload, FileText, CheckCircle, LogOut } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { fetchClient } from "@/lib/api"

// --- Components ---

// FileUpload component moved to @/components/file-upload

const Sidebar = () => {
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        fetchClient("/users/profile").then(async res => {
            if (res.ok) setProfile(await res.json());
        });
    }, []);

    // Determine display values (Manual > Transcript/Default)
    const major = profile?.manual_major || "Computer Science (Default)";
    const gpa = profile?.manual_gpa || "3.8 (Default)";

    return (
        <div className="w-64 bg-gray-900 text-white flex flex-col h-full border-r border-gray-800">
            <div className="p-6 border-b border-gray-800 flex items-center gap-2">
                <Map className="w-6 h-6 text-purple-400" />
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    CareerCompass
                </span>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-medium text-lg">Alex H.</h3>
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
                </div>
            </div>
            <div className="mt-auto p-6 text-xs text-gray-600">
                v0.2.0 Beta
            </div>
        </div>
    )
}

interface TimelineItemProps {
    title: string;
    semester?: string;
    status: string;
    desc: string;
    active: boolean;
    projects?: string[];
    skills?: string[];
    id?: string;
    completed: boolean;
    onToggle: (id: string, completed: boolean) => void;
}

const TimelineItem = ({
    title,
    semester,
    status,
    desc,
    active,
    projects,
    skills,
    id,
    completed,
    onToggle
}: TimelineItemProps) => {
    const [isChecked, setIsChecked] = useState(completed);

    const handleCheckToggle = async () => {
        if (!id) return;

        const newStatus = !isChecked;
        setIsChecked(newStatus);
        onToggle(id, newStatus);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="relative pl-8 pb-6 border-l-2 border-gray-700/50 last:pb-0"
        >
            {/* Timeline dot */}
            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all ${isChecked
                ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/50'
                : active
                    ? 'bg-purple-500 border-purple-500'
                    : 'bg-gray-900 border-gray-500'
                }`}></div>

            {/* Glassmorphism Card */}
            <div
                className={`backdrop-blur-md rounded-xl p-4 transition-all duration-300 ${isChecked
                    ? 'bg-green-500/10 border border-green-500/30 shadow-lg shadow-green-500/10'
                    : 'bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800/60 hover:border-gray-600/50'
                    }`}
            >
                <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                        onClick={handleCheckToggle}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isChecked
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-600 hover:border-purple-500'
                            }`}
                    >
                        {isChecked && (
                            <CheckCircle className="w-4 h-4 text-white" />
                        )}
                    </button>

                    {/* Content */}
                    <div className="flex-1">
                        <div className="mb-2">
                            <span className="text-xs text-purple-400 font-mono mb-1 block">{semester}</span>
                            <h4 className={`font-semibold text-lg transition-colors ${isChecked ? 'text-green-400 line-through' : active ? 'text-purple-400' : 'text-gray-200'
                                }`}>
                                {title}
                            </h4>
                            <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">{status}</span>
                        </div>

                        <p className="text-sm text-gray-400 mb-3">{desc}</p>

                        {projects && projects.length > 0 && (
                            <div className="mb-2">
                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-1.5">Key Projects</h5>
                                <div className="flex flex-wrap gap-2">
                                    {projects.map((p, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 bg-gray-900/50 border border-gray-700/50 rounded text-xs text-gray-300 backdrop-blur-sm"
                                        >
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {skills && skills.length > 0 && (
                            <div>
                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-1.5">Skills</h5>
                                <div className="flex flex-wrap gap-1.5">
                                    {skills.map((s, i) => (
                                        <span key={i} className="text-xs text-purple-400/80">#{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

const ProgressBar = ({ completed, total }: { completed: number; total: number }) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return (
        <div className="mb-6">
            <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-gray-300">Overall Progress</span>
                <span className="text-sm text-purple-400">{completed} / {total} completed</span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-gray-700/50">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-500 to-green-500 rounded-full shadow-lg shadow-purple-500/50"
                />
            </div>
        </div>
    );
}

const RoadmapTimeline = () => {
    const [steps, setSteps] = useState<any[]>([]);
    const [generating, setGenerating] = useState(false);
    const router = useRouter();

    const handleLogout = () => {
        // Remove token from cookie
        document.cookie = "token=; path=/; max-age=0";

        toast.success("Logged out successfully.");
        router.push("/login");
    };

    const handleGenerate = async (uploadedTranscript: boolean = false) => {
        console.log("Sending request... UploadedTranscript:", uploadedTranscript);
        setGenerating(true);

        if (uploadedTranscript) {
            toast.info("Generating your personalized roadmap based on transcript...");
        }

        try {
            // Hardcoded user ID for demo (Alex)
            const userId = "7dd566d5-5571-40f6-b913-e5e681ea0cb1";

            const payload = {
                user_id: userId,
                interests: ["Software Engineering", "AI", "Distributed Systems"],
                transcript_summary: uploadedTranscript ? "Refer to Profile" : "No transcript provided"
            };
            console.log("Request Payload:", payload);

            const res = await fetchClient("/roadmaps/generate", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("API Error Response:", errorText);
                throw new Error(`Failed to generate: ${res.status} ${res.statusText} - ${errorText}`);
            }

            const data = await res.json();
            console.log("Response received:", data);

            if (data.roadmap && data.roadmap.milestones) {
                const newSteps = data.roadmap.milestones.map((m: any, index: number) => ({
                    id: m.id || `milestone-${index}`,
                    title: m.title,
                    semester: m.semester,
                    status: m.status || "Planned",
                    desc: m.description,
                    active: index === 0,
                    projects: m.projects,
                    skills: m.skills,
                    completed: false
                }));
                setSteps(newSteps);
                toast.success("Roadmap Successfully Generated!");
            } else {
                console.warn("Unexpected response structure:", data);
                toast.success("Roadmap Generated (No milestones found)!");
            }

        } catch (error: any) {
            console.error("Generator Error:", error);
            // Alert specific error to screen for debugging
            alert(`Error: ${error.message}`);
            toast.error(`Error generating roadmap: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    }

    const handleMilestoneToggle = async (milestoneId: string, isCompleted: boolean) => {
        try {
            const newStatus = isCompleted ? "Done" : "Pending";

            const res = await fetchClient(`/roadmaps/milestones/${milestoneId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error("Failed to update milestone");

            // Update local state
            setSteps(prevSteps =>
                prevSteps.map(step =>
                    step.id === milestoneId
                        ? { ...step, completed: isCompleted, status: newStatus }
                        : step
                )
            );

            toast.success(isCompleted ? "Milestone completed! 🎉" : "Milestone unmarked");

        } catch (error) {
            console.error(error);
            toast.error("Failed to update milestone");
        }
    };

    const completedCount = steps.filter((step: any) => step.completed).length;

    return (
        <div className="flex-1 p-8 bg-gray-950 text-white overflow-hidden flex flex-col h-screen">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold">Your Roadmap</h1>
                    <p className="text-gray-400">Generated based on your interest in "Software Engineering"</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={() => handleGenerate(false)}
                        disabled={generating}
                        className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    >
                        {generating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {generating ? "Generating..." : "Generate with AI"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>
            </div>

            <div className="mb-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-purple-200">Want better recommendations?</h3>
                    <p className="text-sm text-gray-400">Update your profile with new hobbies or transcripts.</p>
                </div>
                <Button onClick={() => router.push("/profile")} variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white">
                    Go to Profile
                </Button>
            </div>

            <ProgressBar completed={completedCount} total={steps.length} />

            <div className="flex-1 overflow-y-auto pr-4">
                <motion.div
                    className="max-w-2xl"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.1
                            }
                        }
                    }}
                >
                    {steps.map((s: any, i: number) => (
                        <TimelineItem
                            key={s.id || i}
                            {...s}
                            id={s.id}
                            completed={s.completed || false}
                            onToggle={handleMilestoneToggle}
                        />
                    ))}
                </motion.div>
            </div>
        </div>
    )
}

const ChatInterface = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: any }[]>([
        { role: 'assistant', content: "Hello! I'm your Career AI. How can I help you adjust your roadmap today?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetchClient("/chat", {
                method: "POST",
                body: JSON.stringify({ query: userMsg })
            });
            const data = await res.json();

            // The backend returns { response: string, context: [] }
            // Let's format it nicely
            const content = (
                <div className="space-y-2">
                    <p>{data.response}</p>
                    {data.context && data.context.length > 0 && (
                        <div className="text-xs bg-gray-800 p-2 rounded border border-gray-700">
                            <p className="font-bold text-gray-500 mb-1">Sources:</p>
                            <ul className="list-disc pl-3 text-gray-400 space-y-1">
                                {data.context.map((c: any, i: number) => (
                                    <li key={i}>{c.content.substring(0, 100)}...</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );

            setMessages(prev => [...prev, { role: 'assistant', content }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI server." }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={`transition-all duration-300 ease-in-out border-l border-gray-800 bg-gray-900 h-full flex flex-col ${isOpen ? 'w-96' : 'w-12'}`}>
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                {isOpen && (
                    <div className="flex items-center gap-2 font-semibold text-white">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>AI Assistant</span>
                    </div>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-gray-400 h-6 w-6">
                    {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </Button>
            </div>

            {isOpen && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${m.role === 'user'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-200 border border-gray-700'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-800 rounded-lg p-3 text-sm flex gap-1 items-center">
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-gray-800">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Ask about your career..."
                                className="bg-gray-950 border-gray-700 text-white focus-visible:ring-purple-500"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            />
                            <Button size="icon" className="bg-purple-600 hover:bg-purple-700" onClick={sendMessage}>
                                <Send size={16} />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default function Dashboard() {
    return (
        <div className="flex h-screen bg-black overflow-hidden font-sans">
            <Sidebar />
            <RoadmapTimeline />
            <ChatInterface />
        </div>
    )
}
