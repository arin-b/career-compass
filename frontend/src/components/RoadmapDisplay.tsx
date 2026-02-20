"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

// -- Types --

export interface MilestoneData {
    id?: string;
    title: string;
    semester?: string;
    status: string;
    desc: string;
    active: boolean;
    projects?: string[];
    skills?: string[];
    completed: boolean;
}

interface TimelineItemProps extends MilestoneData {
    readOnly?: boolean;
    onToggle?: (id: string, completed: boolean) => void;
}

// -- TimelineItem --

export const TimelineItem = ({
    title,
    semester,
    status,
    desc,
    active,
    projects,
    skills,
    id,
    completed,
    readOnly = false,
    onToggle,
}: TimelineItemProps) => {
    const [isChecked, setIsChecked] = useState(completed);

    const handleCheckToggle = async () => {
        if (readOnly || !onToggle) return;
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
            <div className={`absolute -left-[13px] top-0 w-6 h-6 rounded-full border-4 transition-all shadow-lg ${isChecked
                ? 'bg-green-500 border-green-200 shadow-green-500/50'
                : active
                    ? 'bg-purple-500 border-purple-200 shadow-purple-500/50'
                    : 'bg-gray-400 border-gray-200'
                }`}></div>

            {/* Glassmorphism Card */}
            <div
                className={`backdrop-blur-md rounded-2xl p-6 transition-all duration-300 shadow-xl ${isChecked
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-700'
                    : 'bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 hover:bg-white/90 dark:hover:bg-gray-800/90'
                    }`}
            >
                <div className="flex items-start gap-3">
                    {/* Checkbox — hidden in read-only mode */}
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={handleCheckToggle}
                            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${isChecked
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-600 hover:border-purple-500'
                                }`}
                        >
                            {isChecked && (
                                <CheckCircle className="w-4 h-4 text-white" />
                            )}
                        </button>
                    )}

                    {/* Read-only status indicator */}
                    {readOnly && (
                        <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${isChecked ? 'bg-green-500' : 'bg-gray-600'}`}>
                            {isChecked && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1">
                        <div className="mb-4">
                            <span className="text-sm text-purple-600 dark:text-purple-400 font-mono mb-2 block bg-purple-100 dark:bg-purple-900/50 px-3 py-1 rounded-full inline-block">{semester}</span>
                            <h4 className={`font-bold text-2xl transition-colors mb-2 ${isChecked ? 'text-green-600 dark:text-green-400 line-through' : active ? 'text-purple-600 dark:text-purple-400' : 'text-gray-800 dark:text-gray-200'
                                }`}>
                                {title}
                            </h4>
                            <span className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{status}</span>
                        </div>

                        <p className="text-base text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{desc}</p>

                        {projects && projects.length > 0 && (
                            <div className="mb-4">
                                <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-3">Key Projects</h5>
                                <div className="flex flex-wrap gap-3">
                                    {projects.map((p, i) => (
                                        <span
                                            key={i}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 border border-blue-200 dark:border-blue-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 shadow-sm"
                                        >
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {skills && skills.length > 0 && (
                            <div>
                                <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-3">Skills</h5>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((s, i) => (
                                        <span key={i} className="text-sm text-purple-600 dark:text-purple-400 font-medium"># {s}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// -- ProgressBar --

export const ProgressBar = ({ completed, total }: { completed: number; total: number }) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return (
        <div className="mb-8">
            <div className="flex justify-between mb-4">
                <span className="text-xl font-bold text-gray-800 dark:text-gray-200">Overall Progress</span>
                <span className="text-xl text-purple-600 dark:text-purple-400 font-semibold">{completed} / {total} completed</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden shadow-inner border border-gray-300 dark:border-gray-600">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 rounded-full shadow-lg relative"
                >
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                </motion.div>
            </div>
        </div>
    );
};

// -- RoadmapDisplay (composite component) --

interface RoadmapDisplayProps {
    milestones: MilestoneData[];
    readOnly?: boolean;
    onToggle?: (id: string, completed: boolean) => void;
}

export const RoadmapDisplay = ({ milestones, readOnly = false, onToggle }: RoadmapDisplayProps) => {
    const completedCount = milestones.filter((s) => s.completed).length;

    if (milestones.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <p className="text-lg">No roadmap milestones found.</p>
            </div>
        );
    }

    return (
        <div>
            <ProgressBar completed={completedCount} total={milestones.length} />
            <motion.div
                className="max-w-5xl mx-auto"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: {
                        transition: {
                            staggerChildren: 0.1,
                        },
                    },
                }}
            >
                {milestones.map((s, i) => (
                    <TimelineItem
                        key={s.id || i}
                        {...s}
                        readOnly={readOnly}
                        onToggle={onToggle}
                    />
                ))}
            </motion.div>
        </div>
    );
};

export default RoadmapDisplay;
