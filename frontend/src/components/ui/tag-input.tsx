"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}

export function TagInput({ value, onChange, placeholder }: TagInputProps) {
    const [input, setInput] = useState("");

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const trimmed = input.trim();
            if (trimmed && !value.includes(trimmed)) {
                onChange([...value, trimmed]);
                setInput("");
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {value.map((tag, index) => (
                    <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-500/30"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-purple-100 focus:outline-none"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || "Type and press Enter..."}
                className="flex h-10 w-full rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
        </div>
    );
}
