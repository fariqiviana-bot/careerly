"use client";
import React from "react";
import { cn } from "@/lib/utils";

export function FarnaviMonogram({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Top Stem & Serif Arch */}
      <path d="M25 29V16.5C25 10 29.5 7.5 39.5 7.5C44.5 7.5 48.5 6.8 51 4.5C49 9.5 45.5 10.5 39.5 10C30.5 9.2 28 12 28 18V25L25 29Z" fill="#1E1F1D" />
      {/* Upper Sage Leaf */}
      <path d="M24.8 39C25 25 32.5 15.5 47.5 11.5C45.5 20 41 23.5 34.5 26.5C29.5 28.8 26.5 33.5 24.8 39Z" fill="#7D897B" />
      {/* Lower Warm Taupe Leaf */}
      <path d="M31 35.5C32 28.5 37 25 43.5 24C41.5 30.5 37.5 33.8 31 35.5Z" fill="#B5A08A" />
      {/* Root & Base Branch */}
      <path d="M20 49.5C23.5 48.5 24.8 43.5 27 31C28.8 40 35 47 46 47C36.5 48.8 30 43.2 28 37.5C27.5 45 25.8 49.5 20 49.5Z" fill="#64574B" />
    </svg>
  );
}

export function FarnaviLogo({ collapsed = false, size = "md", className }: { collapsed?: boolean; size?: "sm" | "md" | "lg"; className?: string }) {
  if (collapsed) {
    return <FarnaviMonogram className={cn("h-8 w-8 shrink-0", className)} />;
  }
  if (size === "lg") {
    return (
      <div className={cn("inline-flex flex-col items-center select-none", className)}>
        <FarnaviMonogram className="h-16 w-16" />
        <div className="mt-1 font-serif text-2xl tracking-[0.28em] text-[#1e1f1d]">F&#923;RN&#923;VI</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="h-px w-8 bg-[#b5a08a]" />
          <span className="inline-block h-2 w-1.5 rotate-45 rounded-full bg-[#7d897b]" />
          <span className="h-px w-8 bg-[#b5a08a]" />
        </div>
      </div>
    );
  }
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <FarnaviMonogram className={size === "sm" ? "h-7 w-7" : "h-8 w-8"} />
      <div className="flex flex-col">
        <span className={cn("font-serif leading-none tracking-[0.22em] text-[#1e1f1d]", size === "sm" ? "text-base" : "text-lg")}>
          F&#923;RN&#923;VI
        </span>
        <span className="mt-0.5 flex items-center gap-1">
          <span className="h-[1px] w-4 bg-[#b5a08a]" />
          <span className="h-1 w-1 rotate-45 rounded-full bg-[#7d897b]" />
          <span className="h-[1px] w-4 bg-[#b5a08a]" />
        </span>
      </div>
    </div>
  );
}