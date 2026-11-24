"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore, type Doc } from "@/lib/store";
import { apiGetCvBySlug } from "@/lib/api/workspace-client";
import { WebsiteView } from "@/components/website-view";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function PersonalWebsitePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { docs } = useStore();
  const [remoteDoc, setRemoteDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fetched = await apiGetCvBySlug(slug);
        if (!cancelled && fetched) {
          setRemoteDoc(fetched as Doc);
        }
      } catch (err) {
        console.warn("[cv/[slug]] DB lookup error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const localDoc =
    docs.find((d) => d.type === "website" && (d.slug === slug || d.id === slug)) ??
    docs.find((d) => d.id === slug) ??
    (slug === "viana-fariqi" ? docs.find((d) => d.type === "website") ?? docs[0] : undefined);

  const doc = remoteDoc ?? localDoc;

  if (loading && !doc) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-[#f7efe2] p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading personal website...
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f7efe2] p-6 text-center">
        <h1 className="font-serif text-3xl">Website not found</h1>
        <p className="text-sm text-muted-foreground">This personal website link is not active yet.</p>
        <Button asChild className="rounded-full">
          <Link href="/documents?tab=website">Back to Farnavi</Link>
        </Button>
      </div>
    );
  }

  return <WebsiteView doc={doc} onClose={() => router.push(`/editor/${doc.id}`)} />;
}