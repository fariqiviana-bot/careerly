"use client";
import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { WebsiteView } from "@/components/website-view";
import { Button } from "@/components/ui/button";

export default function PersonalWebsitePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { docs } = useStore();

  const doc =
    docs.find((d) => d.type === "website" && (d.slug === slug || d.id === slug)) ??
    docs.find((d) => d.id === slug) ??
    docs.find((d) => d.type === "website");

  if (!doc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f7efe2] p-6 text-center">
        <h1 className="font-serif text-3xl">Website not found</h1>
        <p className="text-sm text-muted-foreground">This personal website link is not active yet.</p>
        <Button asChild className="rounded-full"><Link href="/documents?tab=website">Back to Farnavi</Link></Button>
      </div>
    );
  }

  return <WebsiteView doc={doc} onClose={() => router.push(`/editor/${doc.id}`)} />;
}