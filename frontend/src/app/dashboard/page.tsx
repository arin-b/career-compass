"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Send, User, Bot, Sparkles, ChevronLeft, ChevronRight, GraduationCap, Map, BookOpen, Clock, Upload, FileText, CheckCircle, LogOut } from "lucide-react"
import { Trophy } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { fetchClient } from "@/lib/api"

import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle"
import { RoadmapDisplay, ProgressBar, type MilestoneData } from "@/components/RoadmapDisplay"

import confetti from "canvas-confetti"


const RoadmapTimeline = () => {
    const [steps, setSteps] = useState<any[]>([]);
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showCompletionDialog, setShowCompletionDialog] = useState(false);
    const [roadmapHistory, setRoadmapHistory] = useState<any[]>([]);
    const router = useRouter();

    const fetchLatestRoadmap = async () => {
        try {
            const res = await fetchClient("/roadmaps/latest");
            if (res.ok) {
                const data = await res.json();
                console.log("Fetched latest roadmap:", data);
                if (data.roadmap && data.roadmap.milestones) {
                    setSteps(data.roadmap.milestones.map((m: any, index: number) => {
                        const milestoneId = m.id ? String(m.id) : null;
                        console.log(`Milestone ${index}:`, { id: milestoneId, title: m.title, status: m.status });
                        return {
                            id: milestoneId,
                            title: m.title,
                            semester: m.semester,
                            status: m.status || "Pending",
                            desc: m.description,
                            active: index === 0,
                            projects: m.projects,
                            skills: m.skills,
                            completed: m.status === "Done"
                        };
                    }));
                }
            }
        } catch (error) {
            console.log("No existing roadmap found or error fetching.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check if user is admin — redirect them to admin dashboard
        const checkRole = async () => {
            try {
                const profileRes = await fetchClient("/users/profile");
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    if (profileData.role === "admin") {
                        router.push("/admin/dashboard");
                        return;
                    }
                }
            } catch (error) {
                console.error("Role check failed", error);
            }
        };
        checkRole();
        fetchLatestRoadmap();
        fetchRoadmapHistory();
    }, []);

    const handleLogout = () => {
        document.cookie = "token=; path=/; max-age=0";
        document.cookie = "role=; path=/; max-age=0";

        toast.success("Logged out successfully.");
        router.push("/login");
    };

    const fetchRoadmapHistory = async () => {
        try {
            const res = await fetchClient("/roadmaps/history");
            if (res.ok) {
                const data = await res.json();
                setRoadmapHistory(data.roadmaps || []);
            }
        } catch (error) {
            console.log("Error fetching roadmap history:", error);
        }
    };

    const handleGenerateFollowUp = async () => {
        const completedRoadmapSummary = `
Previously Completed Roadmap:
Title: Career Roadmap
Completed Milestones:
${steps.map((s: any) => `- ${s.title}: ${s.desc}`).join('\n')}
        `;
        setShowCompletionDialog(false);
        await handleGenerate(false, completedRoadmapSummary);
    };

    const handleGenerate = async (uploadedTranscript: boolean = false, previousRoadmapContext?: string) => {
        console.log("Sending request... UploadedTranscript:", uploadedTranscript);
        setGenerating(true);

        if (uploadedTranscript) {
            toast.info("Generating your personalized roadmap based on transcript...");
        }

        try {
            const userId = "7dd566d5-5571-40f6-b913-e5e681ea0cb1";

            const payload: any = {
                user_id: userId,
                interests: ["Software Engineering", "AI", "Distributed Systems"],
                transcript_summary: uploadedTranscript ? "Refer to Profile" : "No transcript provided"
            };

            if (previousRoadmapContext) {
                payload.previous_roadmap_summary = previousRoadmapContext;
            }
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

            let roadmapData = data.roadmap;

            // FIX: Handle case where roadmap is nested in a 'text' field (stringified JSON)
            if (roadmapData && !roadmapData.milestones && roadmapData.text) {
                try {
                    console.log("Parsing nested roadmap from 'text' field...");
                    roadmapData = JSON.parse(roadmapData.text);
                } catch (e) {
                    console.error("Failed to parse nested roadmap JSON:", e);
                }
            }

            if (roadmapData && roadmapData.milestones) {
                console.log("Milestones from API:", roadmapData.milestones.map((m: any) => ({ id: m.id, title: m.title })));
                const newSteps = roadmapData.milestones.map((m: any, index: number) => ({
                    id: m.id || `milestone-MISSING-ID-${index}`,
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
                console.error("Roadmap Data Missing. Received:", data);
                console.warn("Unexpected response structure:", data);
                toast.error("Roadmap generated but no milestones found.");
            }

        } catch (error: any) {
            console.error("Generator Error:", error);
            alert(`Error: ${error.message}`);
            toast.error(`Error generating roadmap: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    }

    const handleMilestoneToggle = async (milestoneId: string, isCompleted: boolean) => {
        // Check if milestoneId is a valid UUID, if not, show error
        if (!milestoneId) {
            toast.error("This milestone cannot be updated. Please refresh the page and try again.");
            console.error("Invalid milestone ID:", milestoneId);
            return;
        }

        try {
            console.log("Updating Milestone ID:", milestoneId);
            const newStatus = isCompleted ? "Done" : "Pending";

            const res = await fetchClient(`/roadmaps/milestones/${milestoneId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("API Error:", errorData);
                throw new Error("Failed to update milestone");
            }

            setSteps(prevSteps =>
                prevSteps.map(step =>
                    step.id === milestoneId
                        ? { ...step, completed: isCompleted, status: newStatus }
                        : step
                )
            );

            toast.success(isCompleted ? "Milestone completed! 🎉" : "Milestone unmarked");

            // Refresh roadmap data to ensure UI is in sync
            await fetchLatestRoadmap();

        } catch (error) {
            console.error("Error updating milestone:", error);
            toast.error("Failed to update milestone");
        }
    };

    const completedCount = steps.filter((step: any) => step.completed).length;

    const allCompleted = steps.length > 0 && completedCount === steps.length;

    // Check if all milestones are completed and show celebration
    useEffect(() => {
        if (allCompleted && steps.length > 0) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            setShowCompletionDialog(true);
        }
    }, [allCompleted, steps.length]);

    if (loading) {
        return (
            <div className="flex-1 p-8 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/10 dark:to-blue-900/10 text-gray-900 dark:text-white overflow-hidden flex flex-col h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Loading Your Roadmap</h2>
                    <p className="text-gray-600 dark:text-gray-400">Fetching your personalized career path...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/10 dark:to-blue-900/10 text-gray-900 dark:text-white overflow-hidden flex flex-col h-screen">
            <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 dark:from-purple-400 dark:via-blue-400 dark:to-green-400">User Dashboard</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Generated based on your unique profile and interests</p>
                </div>
                <div className="flex gap-6">
                    <ThemeToggle />
                    <Button
                        onClick={() => handleGenerate(false)}
                        disabled={generating}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl shadow-purple-500/30 px-8 py-3 text-lg rounded-xl"
                    >
                        {generating ? <Sparkles className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                        {generating ? "Generating..." : "Generate with AI"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-8 py-3 text-lg rounded-xl"
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        Logout
                    </Button>
                </div>
            </div>

            <div className="mb-8 p-6 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-xl text-purple-800 dark:text-purple-200">Want better recommendations?</h3>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">Update your profile with new hobbies or transcripts for personalized results.</p>
                    </div>
                    <Button onClick={() => router.push("/profile")} variant="outline" className="border-purple-400 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 px-6 py-2 rounded-xl">
                        Go to Profile
                    </Button>
                </div>
            </div>

            <ProgressBar completed={completedCount} total={steps.length} />

            <div className="flex-1 overflow-y-auto pr-6">
                <RoadmapDisplay
                    milestones={steps}
                    readOnly={false}
                    onToggle={handleMilestoneToggle}
                />
            </div>

            {showCompletionDialog && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowCompletionDialog(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl"
                    >
                        <div className="text-center mb-6">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="inline-block mb-4"
                            >
                                <Trophy className="w-16 h-16 text-yellow-500" />
                            </motion.div>
                            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 dark:from-purple-400 dark:via-blue-400 dark:to-green-400 mb-2">
                                Roadmap Complete! 🎉
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                                Congratulations! You've completed all milestones in your career roadmap. Your dedication and progress are impressive!
                            </p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl p-6 mb-8">
                            <h3 className="font-bold text-lg text-purple-800 dark:text-purple-200 mb-3">Your Journey So Far:</h3>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                You've successfully completed {steps.length} milestone{steps.length !== 1 ? 's' : ''} and acquired valuable skills and experience.
                            </p>
                            {roadmapHistory.length > 1 && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    This is roadmap #{roadmapHistory.length} in your career journey.
                                </p>
                            )}
                        </div>
                        <div className="space-y-3">
                            <Button
                                onClick={handleGenerateFollowUp}
                                disabled={generating}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg py-3 text-lg rounded-xl"
                            >
                                {generating ? <Sparkles className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                {generating ? "Generating Next Roadmap..." : "Generate Next Roadmap"}
                            </Button>
                            <Button
                                onClick={() => setShowCompletionDialog(false)}
                                variant="outline"
                                className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 py-3 text-lg rounded-xl"
                            >
                                Maybe Later
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
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
    const [width, setWidth] = useState(384); // default w-96 = 384px
    const [isResizing, setIsResizing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = () => {
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !containerRef.current) return;

            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            const newWidth = window.innerWidth - e.clientX;

            // Constrain width between 300px and 800px
            if (newWidth >= 300 && newWidth <= 800) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isResizing]);

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

            // Handle structured LLM response: extract text from object if needed
            let responseText = data.response;
            if (typeof responseText === 'object' && responseText !== null) {
                // LangChain may return {type, text, extras} format
                responseText = responseText.text || responseText.content || JSON.stringify(responseText);
            }

            const content = (
                <div className="space-y-2">
                    <p>{responseText}</p>
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
        <div
            ref={containerRef}
            className={`transition-all duration-300 ease-in-out border-l border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 h-full flex flex-col backdrop-blur-md relative group ${isOpen ? '' : 'w-12'}`}
            style={{ width: isOpen ? `${width}px` : '48px' }}
        >
            {isOpen && (
                <div
                    onMouseDown={handleMouseDown}
                    className="absolute left-0 top-0 bottom-0 w-1 bg-transparent hover:bg-purple-500 cursor-ew-resize transition-colors duration-200 group-hover:bg-purple-400"
                    title="Drag to resize chat panel"
                />
            )}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 relative z-10">
                {isOpen && (
                    <div className="flex items-center gap-3 font-bold text-xl text-gray-800 dark:text-gray-200">
                        <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        <span>AI Assistant</span>
                    </div>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-gray-600 dark:text-gray-400 h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-700">
                    {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </Button>
            </div>

            {isOpen && (
                <>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-lg ${m.role === 'user'
                                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 text-sm flex gap-2 items-center shadow-lg border border-gray-200 dark:border-gray-600">
                                    <span className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></span>
                                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-150"></span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex gap-3">
                            <Input
                                placeholder="Ask about your career..."
                                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus-visible:ring-purple-500 rounded-xl h-12 text-base"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            />
                            <Button size="icon" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg h-12 w-12 rounded-xl" onClick={sendMessage}>
                                <Send size={20} />
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
        <div className="flex h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/10 dark:to-blue-900/10 overflow-hidden font-sans">
            <Sidebar />
            <RoadmapTimeline />
            <ChatInterface />
        </div>
    )
}
