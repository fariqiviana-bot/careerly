"use client";
import React, { useEffect, useRef, useState , useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useStore, calculateDocScore, type Content , JUST_CREATED_DOC_IDS , type Doc } from "@/lib/store";
import { TEMPLATE_CATALOG } from "@/lib/template-catalog";
import { LANGS } from "@/lib/catalog";
import { ResumeRender } from "@/components/render";
import { WebsiteView } from "@/components/website-view";
import { ContentEditorPanel } from "@/components/studio/content-editor-panel";
import { DesignerPanel, type HeaderFooterConfig } from "@/components/studio/designer-panel";
import { AnalyzerTailorPanel } from "@/components/studio/analyzer-tailor-panel";
import { ImportResumeModal } from "@/components/studio/import-resume-modal";
import { AtsPlainView } from "@/components/studio/ats-plain-view";
import { AiAssistantDrawer } from "@/components/studio/ai-assistant-drawer";
import { apiTranslateResume } from "@/lib/api/ai-client";
import { apiSmartAutoFit } from "@/lib/api/editor-client";
import {
  apiDownloadInjectedDocx,
  apiDownloadZipBundle,
  apiDownloadTxt,
  apiGetShareLink,
  apiUpsertShareLink,
  type ShareLinkRecord,
} from "@/lib/api/export-client";
import { Switch } from "@/components/ui/switch";
import { apiAnalyzeResume, type ResumeAnalysisReport } from "@/lib/api/analyze-client";
import { ResponsiveModal, Field } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  Palette,
  ScanSearch,
  Sparkles,
  Download,
  History,
  Languages,
  Undo2,
  Redo2,
  Check,
  ExternalLink,
  FileDown,
  Loader2,
  Database,
  UserCheck,
  RefreshCw,
  Upload,
  Eye,
  Cpu,
  Maximize2,
  Share2,
  Package,
  Copy,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  apiGetDocument,
  apiUpsertDocument,
  apiPatchDocument,
  apiListVersions,
  apiCreateVersion,
  apiRestoreVersion,
  apiGetMasterProfile,
  apiSaveMasterProfile,
  apiSyncContactToAll,
  type BackendVersion,
  type BackendMasterProfile,
} from "@/lib/api/documents-client";

type StudioTab = "content" | "designer" | "analyzer" | "tailor";
type SaveState = "syncing" | "saving" | "saved" | "offline" | "conflict";

export default function EditorStudioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { docs, upsertDocFromRemote } = useStore();
  const matched = docs.find((d) => d.id === params.id);
  const [loadState, setLoadState] = useState<"loading" | "not_found">("loading");

  useEffect(() => {
    if (matched) return;
    let cancelled = false;
    (async () => {
      try {
        const remote = await apiGetDocument(params.id);
        if (cancelled) return;
        if (remote) {
          upsertDocFromRemote(remote);
        } else {
          setLoadState("not_found");
        }
      } catch (err) {
        console.warn("[editor] document lookup failed:", err);
        if (!cancelled) setLoadState("not_found");
      }
    })();
    return () => { cancelled = true; };
  }, [params.id, matched, upsertDocFromRemote]);

  if (matched) {
    return <EditorStudioInner key={matched.id} doc={matched} />;
  }
  if (loadState === "not_found") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="font-serif text-2xl">Document not found</h1>
        <p className="text-sm text-muted-foreground">This document may have been deleted or has not been saved yet.</p>
        <button type="button" onClick={() => router.push("/documents")} className="text-sm font-medium text-primary underline">
          Return to Documents
        </button>
      </div>
    );
  }
  return (
    <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading document from workspace...
    </div>
  );
}

function EditorStudioInner({ doc }: { doc: Doc }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sp = useSearchParams();
  const {
    docs,
    addDoc,
    updateDoc,
    translateDoc,
    resetDocToTemplateSample,
  } = useStore();

  // doc is guaranteed by EditorStudioPage wrapper (never falls back to docs[0])
  const [studioTab, setStudioTab] = useState<StudioTab>("content");
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [undoStack, setUndoStack] = useState<Content[]>([]);
  const [redoStack, setRedoStack] = useState<Content[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [masterOpen, setMasterOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [canvasView, setCanvasView] = useState<"recruiter" | "ats">("recruiter");
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [autoFitBusy, setAutoFitBusy] = useState(false);
  const [headerFooter, setHeaderFooter] = useState<HeaderFooterConfig>({
    headerText: "",
    footerText: "",
    pageNumbering: "none",
  });
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [exportBusy, setExportBusy] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLinkRecord | null>(null);
  const [liveAnalysis, setLiveAnalysis] = useState<ResumeAnalysisReport | null>(null);
  const [targetLang, setTargetLang] = useState("English (US)");

  // Backend persistence state
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [dbVersions, setDbVersions] = useState<BackendVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [masterProfile, setMasterProfile] = useState<BackendMasterProfile | null>(null);
  const [masterBusy, setMasterBusy] = useState(false);

  const initialSeriesRef = useRef<string | null>(null);
  const hydratedDocRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);
  const lastSyncedSnapshotRef = useRef<{
    title?: string;
    seriesId?: string;
    activeTab?: string;
    content?: Record<string, any>;
    settings?: Record<string, any>;
    visibility?: Record<string, any>;
  } | null>(null);
  const updateDocRef = useRef(updateDoc);
  updateDocRef.current = updateDoc;
  const lastSavedSigRef = useRef<string>("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverUpdatedAtRef = useRef<string | null>(null);
  const saveSeqRef = useRef<number>(0);
  const abortCtrlRef = useRef<AbortController | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef<number>(0);
  const pendingSaveRef = useRef<{ docId: string; sig: string; payload: Record<string, any> } | null>(null);

  useEffect(() => {
    const t = sp.get("tab");
    if (t === "tailor" || t === "analyzer" || t === "designer" || t === "content") {
      setStudioTab(t);
    }
    const dl = sp.get("download");
    if (dl) {
      setExportOpen(true);
    }
  }, [sp]);

  // 1. Hydrate from SQLite backend on open (or seed into DB if first time opening)
  useEffect(() => {
    if (!doc?.id || hydratedDocRef.current === doc.id) return;
    initialSeriesRef.current = String(doc.series || doc.template || '11');
    let cancelled = false;

    const buildPayload = () => ({
      id: doc.id,
      type: doc.type || "resume",
      title: doc.title || "Untitled Resume",
      seriesId: String(doc.series || doc.template || "11"),
      activeTab: doc.activeTab || "resume",
      language: doc.language || "English",
      accent: doc.accent || "#202124",
      font: doc.font || "Merriweather",
      score: calculateDocScore(doc.content).score,
      pinned: Boolean(doc.pinned),
      label: doc.label || null,
      targetJobTitle: doc.tailoredJobTitle || null,
      targetCompany: doc.tailoredCompany || null,
      targetJd: doc.tailoredJd || null,
      content: doc.content,
      settings: doc.settings || {},
      visibility: doc.visibility || {},
      sectionOrder: doc.sectionOrder || [],
    });

    (async () => {
      setSaveState("syncing");
      try {
        const isBrandNew = JUST_CREATED_DOC_IDS.has(doc.id);
        const remote = isBrandNew ? null : await apiGetDocument(doc.id);
        if (isBrandNew) JUST_CREATED_DOC_IDS.delete(doc.id);
        if (cancelled) return;
        if (remote) {
          if (remote.updatedAt) serverUpdatedAtRef.current = remote.updatedAt;
          hydratedDocRef.current = doc.id;
          lastSavedSigRef.current = JSON.stringify({
            title: remote.title,
            seriesId: remote.seriesId,
            activeTab: remote.activeTab,
            content: remote.content,
            settings: remote.settings || {},
            visibility: remote.visibility || {},
            headerFooter: (remote.headerFooter as HeaderFooterConfig) || headerFooter,
            customLabels: remote.customLabels || customLabels,
          });
          lastSyncedSnapshotRef.current = {
            title: remote.title,
            seriesId: remote.seriesId,
            activeTab: remote.activeTab,
            content: JSON.parse(JSON.stringify(remote.content || {})),
            settings: JSON.parse(JSON.stringify(remote.settings || {})),
            visibility: JSON.parse(JSON.stringify(remote.visibility || {})),
          };
          setDbVersions(Array.isArray(remote.versions) ? remote.versions : []);
          if (remote.headerFooter) setHeaderFooter(remote.headerFooter as HeaderFooterConfig);
          if (remote.customLabels) setCustomLabels(remote.customLabels);
          const localSwitched = initialSeriesRef.current && String(doc.series || doc.template || '11') !== initialSeriesRef.current;
          if (!localSwitched && remote.content && Object.keys(remote.content).length > 0) {
            updateDoc(doc.id, {
              title: remote.title,
              series: remote.seriesId,
              template: remote.seriesId,
              activeTab: remote.activeTab,
              content: remote.content,
              settings: remote.settings,
              visibility: remote.visibility,
            });
          }
          setSaveState("saved");
        } else {
          const payload = buildPayload();
          const created = await apiUpsertDocument(payload);
          if (created?.updatedAt) serverUpdatedAtRef.current = created.updatedAt;
          if (cancelled) return;
          hydratedDocRef.current = doc.id;
          lastSavedSigRef.current = JSON.stringify({
            title: payload.title,
            seriesId: payload.seriesId,
            activeTab: payload.activeTab,
            content: payload.content,
            settings: payload.settings || {},
            visibility: payload.visibility || {},
            headerFooter,
            customLabels,
          });
          lastSyncedSnapshotRef.current = {
            title: payload.title,
            seriesId: payload.seriesId,
            activeTab: payload.activeTab,
            content: JSON.parse(JSON.stringify(payload.content || {})),
            settings: JSON.parse(JSON.stringify(payload.settings || {})),
            visibility: JSON.parse(JSON.stringify(payload.visibility || {})),
          };
          setDbVersions(Array.isArray(created?.versions) ? created.versions : []);
          setSaveState("saved");
        }
      } catch {
        if (!cancelled) {
          hydratedDocRef.current = doc.id;
          setSaveState("offline");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [doc?.id]);

  // 2. Debounced real autosave to SQLite DB on any edit
  const currentSig = doc
    ? JSON.stringify({
        title: doc.title,
        seriesId: String(doc.series || doc.template || "11"),
        activeTab: doc.activeTab || "resume",
        content: doc.content,
        settings: doc.settings || {},
        visibility: doc.visibility || {},
        headerFooter,
        customLabels,
      })
    : "";

  const flushAutosave = useCallback(async (opts?: { keepalive?: boolean }) => {
    const pending = pendingSaveRef.current;
    if (!pending) return;
    if (pending.sig === lastSavedSigRef.current) {
      pendingSaveRef.current = null;
      return;
    }

    // Never abort an in-flight DB commit; let it finish updating serverUpdatedAtRef, then drain latest pending state
    if (!opts?.keepalive && isSavingRef.current) {
      return;
    }

    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    if (!opts?.keepalive) isSavingRef.current = true;
    const seq = ++saveSeqRef.current;
    setSaveState("saving");
    let shouldDrain = false;

    try {
      const saved = await apiPatchDocument(
        pending.docId,
        {
          ...pending.payload,
          ...(serverUpdatedAtRef.current ? { expectedUpdatedAt: serverUpdatedAtRef.current } : {}),
        },
        { keepalive: opts?.keepalive }
      );
      if (saved?.updatedAt) serverUpdatedAtRef.current = saved.updatedAt;
      lastSyncedSnapshotRef.current = {
        title: pending.payload.title,
        seriesId: pending.payload.seriesId,
        activeTab: pending.payload.activeTab,
        content: JSON.parse(JSON.stringify(pending.payload.content || {})),
        settings: JSON.parse(JSON.stringify(pending.payload.settings || {})),
        visibility: JSON.parse(JSON.stringify(pending.payload.visibility || {})),
      };
      lastSavedSigRef.current = pending.sig;
      if (pendingSaveRef.current?.sig === pending.sig) {
        pendingSaveRef.current = null;
        if (seq === saveSeqRef.current) {
          retryAttemptRef.current = 0;
          setSaveState("saved");
        }
      } else if (pendingSaveRef.current) {
        shouldDrain = true;
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      if (err?.status === 409) {
        const remoteDoc = err?.serverDocument;
        if (remoteDoc && !opts?.keepalive) {
          try {
            const base = lastSyncedSnapshotRef.current || {};
            const isPlainObject = (v: any): v is Record<string, any> =>
              Boolean(v) && typeof v === "object" && !Array.isArray(v);
            const eqJson = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

            const mergeArray = (bArr: any[], rArr: any[], lArr: any[]): any[] => {
              const isObjWithId = (arr: any[]) =>
                arr.length > 0 &&
                arr.every((x) => isPlainObject(x) && typeof x.id === "string" && x.id.length > 0);

              if (
                (bArr.length === 0 || isObjWithId(bArr)) &&
                (rArr.length === 0 || isObjWithId(rArr)) &&
                (lArr.length === 0 || isObjWithId(lArr)) &&
                (isObjWithId(rArr) || isObjWithId(lArr))
              ) {
                const bMap = new Map<string, any>(bArr.map((x) => [x.id, x]));
                const lMap = new Map<string, any>(lArr.map((x) => [x.id, x]));
                const merged: any[] = [];
                const seen = new Set<string>();

                for (const rItem of rArr) {
                  const id = rItem.id;
                  seen.add(id);
                  const bItem = bMap.get(id);
                  const lItem = lMap.get(id);
                  if (lItem !== undefined) {
                    merged.push(merge3Way(bItem, rItem, lItem));
                  } else if (bItem !== undefined) {
                    if (!eqJson(rItem, bItem)) merged.push(rItem);
                  } else {
                    merged.push(rItem);
                  }
                }

                for (const lItem of lArr) {
                  const id = lItem.id;
                  if (seen.has(id)) continue;
                  const bItem = bMap.get(id);
                  if (bItem === undefined) {
                    merged.push(lItem);
                  } else if (!eqJson(lItem, bItem)) {
                    merged.push(lItem);
                  }
                }
                return merged;
              }

              const isPrimArr = (arr: any[]) =>
                arr.every((x) => x === null || (typeof x !== "object" && typeof x !== "function"));
              if (isPrimArr(bArr) && isPrimArr(rArr) && isPrimArr(lArr)) {
                if (bArr.length === rArr.length && rArr.length === lArr.length) {
                  return rArr.map((rVal, idx) => (!eqJson(lArr[idx], bArr[idx]) ? lArr[idx] : rVal));
                }
                const lSet = new Set(lArr);
                const bSet = new Set(bArr);
                const removedByLocal = new Set(bArr.filter((x) => !lSet.has(x)));
                const addedByLocal = lArr.filter((x) => !bSet.has(x));
                const out = rArr.filter((x) => !removedByLocal.has(x));
                for (const item of addedByLocal) {
                  if (!out.includes(item)) out.push(item);
                }
                return out;
              }

              const maxLen = Math.max(rArr.length, lArr.length);
              const out: any[] = [];
              for (let i = 0; i < maxLen; i++) {
                const hasR = i < rArr.length;
                const hasL = i < lArr.length;
                const hasB = i < bArr.length;
                if (hasR && hasL) {
                  out.push(merge3Way(hasB ? bArr[i] : undefined, rArr[i], lArr[i]));
                } else if (hasR && !hasL) {
                  if (!hasB) out.push(rArr[i]);
                } else if (!hasR && hasL) {
                  if (!hasB) out.push(lArr[i]);
                }
              }
              return out;
            };

            const merge3Way = (b: any, r: any, l: any): any => {
              if (eqJson(l, b)) return r;
              if (eqJson(r, b)) return l;
              if (Array.isArray(r) && Array.isArray(l)) {
                return mergeArray(Array.isArray(b) ? b : [], r, l);
              }
              if (isPlainObject(r) && isPlainObject(l)) {
                const bObj = isPlainObject(b) ? b : {};
                const out: Record<string, any> = {};
                const keys = new Set([...Object.keys(r), ...Object.keys(l)]);
                for (const k of keys) {
                  if (!(k in l)) {
                    if (!(k in bObj)) out[k] = r[k];
                  } else if (!(k in r)) {
                    if (!(k in bObj) || !eqJson(l[k], bObj[k])) out[k] = l[k];
                  } else {
                    out[k] = merge3Way(bObj[k], r[k], l[k]);
                  }
                }
                return out;
              }
              return l;
            };

            const mergedContent = merge3Way(base.content || {}, remoteDoc.content || {}, pending.payload.content || {});
            const mergedSettings = merge3Way(base.settings || {}, remoteDoc.settings || {}, pending.payload.settings || {});
            const mergedVisibility = merge3Way(base.visibility || {}, remoteDoc.visibility || {}, pending.payload.visibility || {});
            const mergedTitle =
              pending.payload.title !== base.title ? pending.payload.title : remoteDoc.title ?? pending.payload.title;
            const mergedSeries =
              pending.payload.seriesId !== base.seriesId
                ? pending.payload.seriesId
                : remoteDoc.seriesId ?? pending.payload.seriesId;
            const mergedTab =
              pending.payload.activeTab !== base.activeTab
                ? pending.payload.activeTab
                : remoteDoc.activeTab ?? pending.payload.activeTab;

            const mergedPayload: Record<string, any> = {
              ...pending.payload,
              title: mergedTitle,
              seriesId: mergedSeries,
              activeTab: mergedTab,
              content: mergedContent,
              settings: mergedSettings,
              visibility: mergedVisibility,
            };

            const retried = await apiPatchDocument(pending.docId, {
              ...mergedPayload,
              ...(remoteDoc.updatedAt ? { expectedUpdatedAt: remoteDoc.updatedAt } : {}),
            });
            if (retried?.updatedAt) serverUpdatedAtRef.current = retried.updatedAt;
            lastSyncedSnapshotRef.current = {
              title: mergedTitle,
              seriesId: mergedSeries,
              activeTab: mergedTab,
              content: JSON.parse(JSON.stringify(mergedContent)),
              settings: JSON.parse(JSON.stringify(mergedSettings)),
              visibility: JSON.parse(JSON.stringify(mergedVisibility)),
            };
            lastSavedSigRef.current = JSON.stringify({
              title: mergedTitle,
              seriesId: mergedSeries,
              activeTab: mergedTab,
              content: mergedContent,
              settings: mergedSettings,
              visibility: mergedVisibility,
              headerFooter: mergedPayload.headerFooter,
              customLabels: mergedPayload.customLabels,
            });
            pendingSaveRef.current = null;
            updateDocRef.current(pending.docId, {
              title: mergedTitle,
              series: mergedSeries,
              template: mergedSeries,
              activeTab: mergedTab,
              content: mergedContent as any,
              settings: mergedSettings as any,
              visibility: mergedVisibility as any,
            });
            retryAttemptRef.current = 0;
            setSaveState("saved");
            return;
          } catch (mergeErr) {
            console.warn("[editor] auto-merge retry failed:", mergeErr);
          }
        }
        setSaveState("conflict");
        toast.error("Updated in another tab. Refresh to avoid overwriting newer edits.", {
          id: "doc-conflict",
        });
        return;
      }
      const errStatus = Number((err as any)?.status || 0);
      if (errStatus === 401 || errStatus === 403 || errStatus === 404) {
        try {
          const meRes = await fetch("/api/auth/me", { cache: "no-store" });
          const meData = await meRes.json().catch(() => null);
          if (!meData?.user) {
            setSaveState("offline");
            toast.error("Your session expired. Sign in again to save your latest edits.", {
              id: "session-expired",
              duration: 10000,
            });
            return;
          }
        } catch {}
      }
      if (errStatus === 400 || errStatus === 413) {
        setSaveState("offline");
        toast.error((err as any)?.message || "Could not save: content limit exceeded.", {
          id: "doc-validation-error",
        });
        return;
      }
      setSaveState("offline");
      const delay = Math.min(15000, 2000 * Math.pow(2, retryAttemptRef.current++));
      retryTimerRef.current = setTimeout(() => {
        flushAutosave();
      }, delay);
    } finally {
      if (!opts?.keepalive) {
        isSavingRef.current = false;
        if (shouldDrain && pendingSaveRef.current && pendingSaveRef.current.sig !== lastSavedSigRef.current) {
          setTimeout(() => {
            flushAutosave();
          }, 40);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!doc?.id || hydratedDocRef.current !== doc.id) return;
    if (!currentSig || currentSig === lastSavedSigRef.current) return;

    pendingSaveRef.current = {
      docId: doc.id,
      sig: currentSig,
      payload: {
        title: doc.title,
        seriesId: String(doc.series || doc.template || "11"),
        activeTab: doc.activeTab || "resume",
        language: doc.language || "English",
        accent: doc.accent || "#202124",
        font: doc.font || "Merriweather",
        score: calculateDocScore(doc.content).score,
        targetJobTitle: doc.tailoredJobTitle || null,
        targetCompany: doc.tailoredCompany || null,
        targetJd: doc.tailoredJd || null,
        content: doc.content,
        settings: doc.settings || {},
        visibility: doc.visibility || {},
        sectionOrder: doc.sectionOrder || [],
        headerFooter,
        customLabels,
      },
    };

    setSaveState("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      flushAutosave();
    }, 650);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [currentSig, doc?.id, flushAutosave]);

  useEffect(() => {
    const onOnline = () => {
      if (pendingSaveRef.current) {
        retryAttemptRef.current = 0;
        flushAutosave();
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingSaveRef.current && pendingSaveRef.current.sig !== lastSavedSigRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const onPageHide = () => {
      if (pendingSaveRef.current && pendingSaveRef.current.sig !== lastSavedSigRef.current) {
        flushAutosave({ keepalive: true });
      }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [flushAutosave]);

  // 3. Live 28-point analysis for topbar issue badge & "What ATS Sees" view
  useEffect(() => {
    if (!doc?.id) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const rep = await apiAnalyzeResume({
          content: doc.content,
          seriesId: String(doc.series || doc.template || "11"),
          settings: doc.settings || {},
        });
        if (!cancelled) setLiveAnalysis(rep);
      } catch (err) { console.warn("[editor]", err); }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [currentSig, doc?.id]);

  if (!doc) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Document not found.{" "}
        <button onClick={() => router.push("/documents")} className="text-primary underline">
          Return to Documents
        </button>
      </div>
    );
  }

  const sId = String(doc.series || doc.template || "11");
  const tplMeta = TEMPLATE_CATALOG.find((t) => t.id === sId) || TEMPLATE_CATALOG[0];
  const calc = calculateDocScore(doc.content);

  const handlePatchContent = (nextContentOrPatch: any) => {
    if (nextContentOrPatch && nextContentOrPatch.__settings) {
      updateDoc(doc.id, { settings: nextContentOrPatch.__settings });
      return;
    }
    if (nextContentOrPatch && nextContentOrPatch.__visibility) {
      updateDoc(doc.id, { visibility: nextContentOrPatch.__visibility });
      return;
    }
    setUndoStack((prev) => [JSON.parse(JSON.stringify(doc.content)), ...prev.slice(0, 19)]);
    setRedoStack([]);
    updateDoc(doc.id, { content: nextContentOrPatch });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const [prev, ...rest] = undoStack;
    setRedoStack((r) => [JSON.parse(JSON.stringify(doc.content)), ...r]);
    setUndoStack(rest);
    updateDoc(doc.id, { content: prev });
    toast.success("Undid last change");
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const [next, ...rest] = redoStack;
    setUndoStack((u) => [JSON.parse(JSON.stringify(doc.content)), ...u]);
    setRedoStack(rest);
    updateDoc(doc.id, { content: next });
    toast.success("Redid change");
  };

  const openHistoryModal = async () => {
    setHistoryOpen(true);
    setLoadingVersions(true);
    try {
      const list = await apiListVersions(doc.id);
      setDbVersions(list);
    } catch {
      toast.error("Could not load version history from database");
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleSaveSnapshot = async () => {
    try {
      // Flush latest state before snapshotting
      const savedSnap = await apiPatchDocument(doc.id, {
        title: doc.title,
        seriesId: sId,
        content: doc.content,
        settings: doc.settings || {},
        visibility: doc.visibility || {},
        headerFooter,
        customLabels,
      });
      if (savedSnap?.updatedAt) serverUpdatedAtRef.current = savedSnap.updatedAt;
      const label =
        snapshotLabel.trim() ||
        `Manual Snapshot (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`;
      const created = await apiCreateVersion(doc.id, label, "manual");
      setDbVersions((prev) => [created, ...prev]);
      setSnapshotLabel("");
      toast.success("Snapshot saved to database");
    } catch {
      toast.error("Failed to save snapshot");
    }
  };

  const handleRestoreSnapshot = async (versionId: string) => {
    try {
      // Cancel queued autosave before restoring so stale edits never overwrite the restored version
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      pendingSaveRef.current = null;
      const restored = await apiRestoreVersion(doc.id, versionId);
      if ((restored as any)?.updatedAt) serverUpdatedAtRef.current = (restored as any).updatedAt;
      lastSavedSigRef.current = JSON.stringify({
        title: restored.title,
        seriesId: restored.seriesId,
        activeTab: restored.activeTab,
        content: restored.content,
        settings: restored.settings,
        visibility: restored.visibility,
      });
      updateDoc(doc.id, {
        series: restored.seriesId,
        template: restored.seriesId,
        content: restored.content,
        settings: restored.settings,
        visibility: restored.visibility,
      });
      if (Array.isArray(restored.versions)) {
        setDbVersions(restored.versions);
      }
      setHistoryOpen(false);
      lastSyncedSnapshotRef.current = {
        title: restored.title,
        seriesId: restored.seriesId,
        activeTab: restored.activeTab,
        content: restored.content,
        settings: restored.settings,
        visibility: restored.visibility,
      };
      setSaveState("saved");
      toast.success("Version restored (previous state auto-backed up)");
    } catch {
      toast.error("Failed to restore version");
    }
  };

  const openMasterModal = async () => {
    setMasterOpen(true);
    setMasterBusy(true);
    try {
      const mp = await apiGetMasterProfile();
      setMasterProfile(mp);
    } catch {
      toast.error("Could not load Master Profile");
    } finally {
      setMasterBusy(false);
    }
  };

  const handleSaveToMaster = async () => {
    setMasterBusy(true);
    try {
      const c = doc.content;
      const saved = await apiSaveMasterProfile({
        contact: {
          name: c.name,
          role: c.role,
          email: c.email,
          phone: c.phone,
          location: c.location,
          linkedin: c.linkedin,
          website: c.website,
        },
        summary: c.summary || "",
        experience: c.experience || [],
        education: c.education || [],
        skills: c.skills || [],
        technicalSkills: c.technicalSkills || [],
        certifications: c.certifications || [],
        courses: c.courses || [],
        awards: c.awards || [],
        volunteering: c.volunteering || [],
        memberships: c.memberships || [],
        references: c.references || [],
      });
      setMasterProfile(saved);
      toast.success("Saved current resume into Master Profile");
    } catch {
      toast.error("Failed to save Master Profile");
    } finally {
      setMasterBusy(false);
    }
  };

  const handleSyncContactToAll = async () => {
    setMasterBusy(true);
    try {
      const c = doc.content;
      const res = await apiSyncContactToAll({
        name: c.name,
        role: c.role,
        email: c.email,
        phone: c.phone,
        location: c.location,
        linkedin: c.linkedin,
        website: c.website,
      });
      toast.success(`Contact info synced across ${res.updatedCount} saved resume(s)`);
    } catch {
      toast.error("Failed to sync contact info");
    } finally {
      setMasterBusy(false);
    }
  };

  const handlePullFromMaster = () => {
    if (!masterProfile) return;
    const mc = masterProfile.contact || {};
    const nextContent: Content = {
      ...doc.content,
      name: mc.name || doc.content.name,
      role: mc.role || doc.content.role,
      email: mc.email || doc.content.email,
      phone: mc.phone || doc.content.phone,
      location: mc.location || doc.content.location,
      linkedin: mc.linkedin || doc.content.linkedin,
      website: mc.website || doc.content.website,
      summary: masterProfile.summary || doc.content.summary,
      experience:
        masterProfile.experience.length > 0 ? masterProfile.experience : doc.content.experience,
      education:
        masterProfile.education.length > 0 ? masterProfile.education : doc.content.education,
      skills: masterProfile.skills.length > 0 ? masterProfile.skills : doc.content.skills,
      technicalSkills:
        masterProfile.technicalSkills.length > 0
          ? masterProfile.technicalSkills
          : doc.content.technicalSkills,
      certifications:
        masterProfile.certifications.length > 0
          ? masterProfile.certifications
          : doc.content.certifications,
      courses: masterProfile.courses.length > 0 ? masterProfile.courses : doc.content.courses,
      awards: masterProfile.awards.length > 0 ? masterProfile.awards : doc.content.awards,
      volunteering:
        masterProfile.volunteering.length > 0
          ? masterProfile.volunteering
          : doc.content.volunteering,
      memberships:
        masterProfile.memberships.length > 0
          ? masterProfile.memberships
          : doc.content.memberships,
      references:
        masterProfile.references.length > 0 ? masterProfile.references : doc.content.references,
    };
    handlePatchContent(nextContent);
    setMasterOpen(false);
    toast.success("Master Profile applied to current resume");
  };

  const flushSaveBeforeExternal = async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    try {
      const savedExt = await apiUpsertDocument({
        id: doc.id,
        type: doc.type || "resume",
        title: doc.title || "Untitled Resume",
        seriesId: sId,
        activeTab: doc.activeTab || "resume",
        language: doc.language || "English",
        accent: doc.accent || "#202124",
        font: doc.font || "Merriweather",
        score: calculateDocScore(doc.content).score,
        pinned: Boolean(doc.pinned),
        label: doc.label || null,
        targetJobTitle: doc.tailoredJobTitle || null,
        targetCompany: doc.tailoredCompany || null,
        targetJd: doc.tailoredJd || null,
        content: doc.content,
        settings: doc.settings || {},
        visibility: doc.visibility || {},
        sectionOrder: doc.sectionOrder || [],
        headerFooter,
        customLabels,
      });
      if (savedExt?.updatedAt) serverUpdatedAtRef.current = savedExt.updatedAt;
      lastSavedSigRef.current = currentSig;
      pendingSaveRef.current = null;
      setSaveState("saved");
    } catch (err) {
      console.warn("[editor] pre-export sync failed:", err);
    }
  };

  const handlePrintVectorPdf = async (mode: "resume" | "cover" | "references" | "combined" = "resume") => {
    try {
      localStorage.setItem(
        `farnavi_print_snapshot_${doc.id}`,
        JSON.stringify({ ...doc, series: sId, seriesId: sId, template: sId, _snapAt: Date.now() })
      );
    } catch {}
    const printUrl = `/print/${encodeURIComponent(doc.id)}?mode=${mode}&series=${encodeURIComponent(sId)}&autoprint=1`;
    const popup = window.open("about:blank", "_blank");
    setExportBusy(`pdf-${mode}`);
    await flushSaveBeforeExternal();
    setExportBusy(null);
    setExportOpen(false);
    if (popup && !popup.closed) {
      popup.location.href = printUrl;
    } else {
      window.open(printUrl, "_blank");
    }
    toast.success(
      mode === "combined"
        ? "Opened Combined Resume + Cover Letter Vector PDF print view"
        : "Opened 1:1 Vector PDF print view"
    );
  };

  const handleExportLiveDocx = async (
    kind: "resume" | "cover" | "references" = "resume",
    mode: "visual" | "ats" = "visual"
  ) => {
    setExportBusy(`docx-${mode}-${kind}`);
    try {
      await apiDownloadInjectedDocx({
        seriesId: sId,
        kind,
        mode,
        accent: doc.accent || "#1F3A5F",
        font: doc.font || "Calibri",
        pageSize: (String(doc.settings?.pageSize || "A4").toLowerCase() === "letter" ? "Letter" : "A4") as "A4" | "Letter",
        pageCount: (Math.min(3, Math.max(1, Number(doc.settings?.pageCount) || 1))) as 1 | 2 | 3,
        fileName: doc.content.name || doc.title,
        content: doc.content,
      });
      toast.success(
        mode === "ats"
          ? "ATS-Safe Word (.docx) downloaded ? 0 TextBoxes, 100% machine-readable"
          : `Live-injected Word (.docx) downloaded using original ${tplMeta.name} template`
      );
    } catch (err: any) {
      toast.error(err?.message || "DOCX export failed");
    } finally {
      setExportBusy(null);
    }
  };

  const handleExportZipBundle = async () => {
    setExportBusy("zip");
    try {
      await apiDownloadZipBundle({
        seriesId: sId,
        pageSize: (String(doc.settings?.pageSize || "A4").toLowerCase() === "letter" ? "Letter" : "A4") as "A4" | "Letter",
        pageCount: (Math.min(3, Math.max(1, Number(doc.settings?.pageCount) || 1))) as 1 | 2 | 3,
        fileName: doc.content.name || doc.title,
        content: doc.content,
      });
      toast.success("Complete Application Package (.zip) downloaded");
    } catch (err: any) {
      toast.error(err?.message || "ZIP export failed");
    } finally {
      setExportBusy(null);
    }
  };

  const handleExportTxt = async () => {
    setExportBusy("txt");
    try {
      await apiDownloadTxt({
        fileName: doc.content.name || doc.title,
        content: doc.content,
      });
      toast.success("ATS Plain-Text (.txt) downloaded");
    } catch {
      toast.error("TXT export failed");
    } finally {
      setExportBusy(null);
    }
  };

  const openShareModal = async () => {
    setShareOpen(true);
    setShareBusy(true);
    try {
      await flushSaveBeforeExternal();
      const existing = await apiGetShareLink(doc.id);
      if (existing) {
        setShareLink(existing);
      } else {
        const created = await apiUpsertShareLink(doc.id, { active: true, showContact: true });
        setShareLink(created);
      }
    } catch (err: any) {
      toast.error(err?.message || "Could not load share link");
    } finally {
      setShareBusy(false);
    }
  };

  if (doc.type === "website") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => router.push("/documents")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input
              value={(doc.title || "").replace(/^Series\s+\d+\s*[\u2014\u2013\-\u00b7]+\s*/i, "")}
              onChange={(e) => updateDoc(doc.id, { title: e.target.value })}
              className="h-8 w-64 border-transparent bg-transparent font-medium hover:border-border focus:bg-background"
            />
          </div>
          <Button className="rounded-full" onClick={() => router.push(`/cv/${doc.slug || "viana-fariqi"}`)}>
            <ExternalLink className="mr-1.5 h-4 w-4" /> Open Live Portfolio Website
          </Button>
        </div>
        <WebsiteView doc={doc} compact />
      </div>
    );
  }

  return (
    <div className="no-print-shell space-y-4">
      {/* UNIFIED STUDIO TOPBAR */}
      <div className="sticky top-14 z-30 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card/95 px-3.5 py-2.5 shadow-xs backdrop-blur">
        {/* Left: Back + Document Title + Live DB Autosave Badge */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => router.push("/documents")}
            title="Back to My Documents"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={doc.title}
            onChange={(e) => updateDoc(doc.id, { title: e.target.value })}
            className="h-8 w-44 border-transparent bg-transparent px-2 text-sm font-semibold hover:border-border focus:border-border focus:bg-background sm:w-52"
          />
          <span
            className={cn(
              "hidden items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium sm:inline-flex",
              saveState === "saved" && "bg-[#e6f0e8] text-[#33613d]",
              (saveState === "saving" || saveState === "syncing") && "bg-amber-50 text-amber-800",
              saveState === "offline" && "bg-muted text-muted-foreground",
              saveState === "conflict" && "bg-red-50 text-red-700",
              saveState === "conflict" && "bg-red-50 text-red-700"
            )}
          >
            {saveState === "saving" || saveState === "syncing" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {saveState === "syncing" ? "Syncing..." : "Saving..."}
              </>
            ) : saveState === "saved" ? (
              <>
                <Check className="h-3 w-3" /> Saved
              </>
            ) : (
              <>
                <Database className="h-3 w-3" /> Local
              </>
            )}
          </span>
        </div>

        {/* Center: 4 Primary Studio Mode Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-full bg-muted p-1">
          {[
            { id: "content", label: "Content Editor", icon: FileText },
            { id: "designer", label: "Designer & Layout", icon: Palette },
            {
              id: "analyzer",
              label: "Analyzer & Fix",
              icon: ScanSearch,
              badge: liveAnalysis ? ((liveAnalysis.stats.errorCount + liveAnalysis.stats.warningCount) > 0 ? String(liveAnalysis.stats.errorCount + liveAnalysis.stats.warningCount) : undefined) : (calc.issues.length > 0 ? String(calc.issues.length) : undefined),
            },
            { id: "tailor", label: "Job Matcher", icon: Sparkles },
          ].map((tab) => {
            const active = studioTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStudioTab(tab.id as StudioTab)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all",
                  active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="rounded-full bg-[#c05b49] px-1.5 py-0.2 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Undo/Redo + Master Profile + History + Translate + Export */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={undoStack.length === 0}
            onClick={handleUndo}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={redoStack.length === 0}
            onClick={handleRedo}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-full border-primary/40 bg-sage-mist/40 px-2.5 text-xs font-semibold text-primary hover:bg-sage-mist"
            onClick={() => setAiDrawerOpen(true)}
            title="Open Farnavi AI Copilot"
          >
            <Sparkles className="mr-1 h-3.5 w-3.5" /> AI Copilot
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden h-8 rounded-full px-2.5 text-xs md:inline-flex"
            onClick={() => setImportOpen(true)}
            title="Import PDF, DOCX, or LinkedIn resume"
          >
            <Upload className="mr-1 h-3.5 w-3.5" /> Import
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden h-8 rounded-full px-2.5 text-xs lg:inline-flex"
            onClick={openMasterModal}
            title="Sync with Master Profile"
          >
            <UserCheck className="mr-1 h-3.5 w-3.5" /> Master
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden h-8 rounded-full px-2.5 text-xs lg:inline-flex"
            onClick={openHistoryModal}
          >
            <History className="mr-1 h-3.5 w-3.5" /> History
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden h-8 rounded-full px-2.5 text-xs xl:inline-flex"
            onClick={() => setTranslateOpen(true)}
          >
            <Languages className="mr-1 h-3.5 w-3.5" /> Translate
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden h-8 rounded-full px-2.5 text-xs xl:inline-flex"
            onClick={openShareModal}
            title="Share via live link"
          >
            <Share2 className="mr-1 h-3.5 w-3.5" /> Share
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-full px-3.5 text-xs font-semibold"
            onClick={() => setExportOpen(true)}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Download / Export
          </Button>
        </div>
      </div>

      {/* MAIN SPLIT-SCREEN STUDIO WORKSPACE */}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="space-y-3.5 lg:col-span-6 xl:col-span-5">
          {studioTab === "content" && (
            <ContentEditorPanel
              doc={doc}
              activeSection={activeSection}
              onSelectSection={setActiveSection}
              onRequestUpgrade={() => toast.info("All studio features are unlocked")}
            />
          )}

          {studioTab === "designer" && (
            <DesignerPanel
              doc={doc}
              headerFooter={headerFooter}
              customLabels={customLabels}
              onHeaderFooterChange={setHeaderFooter}
              onCustomLabelsChange={setCustomLabels}
              onRequestUpgrade={() => toast.info("All studio features are unlocked")}
            />
          )}

          {(studioTab === "analyzer" || studioTab === "tailor") && (
            <AnalyzerTailorPanel
              doc={doc}
              mode={studioTab}
              onRequestUpgrade={() => toast.info("All studio features are unlocked")}
              onJumpToSection={(sec) => {
                if (sec === "designer") {
                  setStudioTab("designer");
                  return;
                }
                setStudioTab("content");
                setActiveSection(sec);
              }}
            />
          )}
        </div>

        <div className="space-y-2.5 lg:sticky lg:top-28 lg:col-span-6 xl:col-span-7">
          {/* Recruiter View vs What ATS Sees Toggle (Enhancv Pattern — 100% non-invasive to templates) */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3 py-1.5 shadow-xs">
            <div className="inline-flex items-center gap-1 rounded-full bg-muted p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setCanvasView("recruiter")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-all",
                  canvasView === "recruiter"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Eye className="h-3.5 w-3.5" /> What Recruiters See
              </button>
              <button
                type="button"
                onClick={() => setCanvasView("ats")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-all",
                  canvasView === "ats"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Cpu className="h-3.5 w-3.5" /> What ATS Sees
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-full px-2.5 text-[11px]"
                disabled={autoFitBusy}
                onClick={async () => {
                  setAutoFitBusy(true);
                  try {
                    const res = await apiSmartAutoFit({
                      content: doc.content,
                      seriesId: sId,
                      pageSize: (String(doc.settings?.pageSize || "A4").toLowerCase() === "letter" ? "Letter" : "A4") as "A4" | "Letter",
                      targetPages: (doc.settings?.pageCount || 1) as 1 | 2 | 3,
                    });
                    updateDoc(doc.id, {
                      settings: {
                        ...(doc.settings || {}),
                        ...res.settings,
                      } as any,
                    });
                    toast.success(res.summary);
                  } catch {
                    toast.error("Auto-Fit failed");
                  } finally {
                    setAutoFitBusy(false);
                  }
                }}
              >
                {autoFitBusy ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Maximize2 className="mr-1 h-3 w-3" />
                )}
                Auto-Fit
              </Button>
              {liveAnalysis && (
                <>
                  <span className="hidden text-muted-foreground sm:inline">
                    Score: <strong className="text-foreground">{liveAnalysis.overallScore}/100</strong>
                  </span>
                  <Badge variant="secondary" className="bg-[#e6f0e8] text-[10px] text-[#33613d]">
                    ATS {liveAnalysis.atsView.parseRate}%
                  </Badge>
                </>
              )}
            </div>
          </div>

          {canvasView === "recruiter" ? (
            <ResumeRender
              doc={doc}
              onPatch={handlePatchContent}
              onSelectSection={(sec) => {
                if (studioTab !== "content") setStudioTab("content");
                setActiveSection(sec);
              }}
            />
          ) : (
            <AtsPlainView data={liveAnalysis?.atsView || null} />
          )}
        </div>
      </div>

      {/* EXPORT MODAL */}
      <ResponsiveModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        title={`Export & Download — (${tplMeta.name})`}
        description="Download your live edited document or access the original static Word, PDF, and Google Docs master files."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2.5 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">
                1. Live Edited Document
              </div>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                {doc.settings?.pageSize || "A4"} · {doc.settings?.pageCount || 1}P
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Generated directly from the changes you made in the Studio editor.
            </p>

            <div className="space-y-2 pt-2">
              <Button
                className="w-full justify-between rounded-xl"
                disabled={Boolean(exportBusy)}
                onClick={() => handlePrintVectorPdf(doc.activeTab === "cover" ? "cover" : doc.activeTab === "references" ? "references" : "resume")}
              >
                <span className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" /> Download Live Vector PDF
                </span>
                <Badge variant="secondary" className="text-[10px]">{["11", "12", "14"].includes(sId) ? "100% ATS Vector" : "Best for ATS Portals"}</Badge>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between rounded-xl border-primary/40 bg-sage-mist/25 text-primary hover:bg-sage-mist"
                disabled={Boolean(exportBusy)}
                onClick={() => handleExportLiveDocx(doc.activeTab === "cover" ? "cover" : doc.activeTab === "references" ? "references" : "resume")}
              >
                <span className="flex items-center gap-2">
                  {exportBusy?.startsWith("docx-visual") ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Download True Word (.docx)
                </span>
                <Badge className="bg-[#e6f0e8] text-[10px] text-[#33613d] hover:bg-[#e6f0e8]">{["11", "12", "14"].includes(sId) ? "100% ATS-Native" : "1:1 Visual ? Word"}</Badge>
              </Button>
              {!["11", "12", "14"].includes(sId) && (
                <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
                  True Word keeps this template&apos;s exact 1:1 layout for Word editing &amp; direct email. For strict ATS portals, download <strong>Vector PDF</strong> or switch to an ATS-Native template (Series 11, 12, or 14).
                </p>
              )}

              <Button
                variant="outline"
                className="w-full justify-between rounded-xl"
                disabled={Boolean(exportBusy)}
                onClick={() => handlePrintVectorPdf("combined")}
              >
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4" /> Combine Resume + Cover Letter (PDF)
                </span>
                <span className="text-[10px] text-muted-foreground">Merged</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between rounded-xl"
                disabled={Boolean(exportBusy)}
                onClick={handleExportZipBundle}
              >
                <span className="flex items-center gap-2">
                  {exportBusy === "zip" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                  Full Application Bundle (.zip)
                </span>
                <span className="text-[10px] text-muted-foreground">3 DOCX + TXT</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between rounded-xl"
                disabled={Boolean(exportBusy)}
                onClick={handleExportTxt}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Download Plain Text (.txt)
                </span>
                <span className="text-[10px] text-[#33613d]">ATS Raw</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2.5 rounded-2xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                2. Original {tplMeta.name} Package
              </div>
              <Badge variant="outline" className="rounded-full text-[10px]">
                Master Files
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Direct downloads of the master `.docx`, `.pdf`, and Google Docs template files.
            </p>

            <div className="max-h-[210px] space-y-1.5 overflow-y-auto pr-1 pt-1">
              {tplMeta.files
                .filter((f) => f.size === (doc.settings?.pageSize === "Letter" ? "letter" : "a4"))
                .map((f, i) => (
                  <a
                    key={i}
                    href={f.url || f.path}
                    download
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium transition-colors hover:border-primary hover:bg-sage-mist/30"
                  >
                    <span className="capitalize">
                      {f.doc} {f.pages ? `(${f.pages}P)` : ""} — {f.size.toUpperCase()}
                    </span>
                    <Badge variant="secondary" className="uppercase text-[10px]">
                      .{f.format}
                    </Badge>
                  </a>
                ))}

              {tplMeta.gdocs.slice(0, 4).map((g) => (
                <a
                  key={g.id}
                  href={g.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-sage-line bg-sage-mist/30 px-3 py-2 text-xs font-medium text-primary hover:bg-sage-mist"
                >
                  <span className="truncate">{g.label || `Google Docs — ${g.doc}`}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </ResponsiveModal>

      {/* REAL DATABASE VERSION HISTORY MODAL */}
      <ResponsiveModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        title="Version History (Database Snapshots)"
        description="Save named milestones or restore any previous version. Restoring automatically backs up your current draft first."
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={snapshotLabel}
              onChange={(e) => setSnapshotLabel(e.target.value)}
              placeholder="Optional label (e.g., Before tailoring for Stripe)"
              className="h-8 flex-1 text-xs"
            />
            <Button
              size="sm"
              className="h-8 rounded-full text-xs"
              onClick={handleSaveSnapshot}
            >
              + Save Snapshot
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full text-xs text-primary"
              onClick={() => {
                resetDocToTemplateSample(doc.id);
                setHistoryOpen(false);
                toast.success("Reset to original template sample text");
              }}
            >
              Reset Sample
            </Button>
          </div>

          <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {loadingVersions ? (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading snapshots...
              </div>
            ) : dbVersions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No saved snapshots yet. Click &ldquo;+ Save Snapshot&rdquo; to create your first milestone.
              </div>
            ) : (
              dbVersions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span>{v.label}</span>
                      <Badge variant="outline" className="text-[9px] uppercase">
                        {v.trigger}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Template {v.seriesId} · {new Date(v.savedAt).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full text-xs"
                    onClick={() => handleRestoreSnapshot(v.id)}
                  >
                    Restore
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </ResponsiveModal>

      {/* FARNAVI AI COPILOT DRAWER (Phase 4) */}
      <AiAssistantDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        content={doc.content}
        seriesId={sId}
        onApplyContent={(next) => handlePatchContent(next)}
      />

      {/* SMART IMPORT + DIFF MODAL (Phase 2) */}
      <ImportResumeModal
        open={importOpen}
        onOpenChange={setImportOpen}
        currentContent={doc.content}
        onApplyToCurrent={async (merged, sourceLabel) => {
          try {
            await apiCreateVersion(doc.id, `Auto-Backup before importing ${sourceLabel}`, "pre-import");
          } catch (err) { console.warn("[editor]", err); }
          handlePatchContent(merged);
          toast.success("Imported sections applied (previous version auto-backed up)");
        }}
        onCreateNewFromImport={(merged, title) => {
          const created = addDoc("resume", title, {
            series: sId,
            template: sId,
            content: merged,
          });
          toast.success(`Created "${title}" from imported resume`);
          router.push(`/editor/${created.id}`);
        }}
      />

      {/* LIVE SHARE LINK MODAL (Phase 6) */}
      <ResponsiveModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        title="Share via Live Link"
        description="Send a clean, always-up-to-date link to recruiters or mentors, with optional contact privacy."
      >
        <div className="space-y-3.5 text-xs">
          {shareBusy && !shareLink ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating share link...
            </div>
          ) : shareLink ? (
            <>
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/25 px-3 py-2.5">
                <div>
                  <div className="font-semibold text-foreground">Public Link Active</div>
                  <div className="text-[11px] text-muted-foreground">
                    {shareLink.viewCount} total view(s)
                  </div>
                </div>
                <Switch
                  checked={shareLink.active}
                  onCheckedChange={async (v) => {
                    const updated = await apiUpsertShareLink(doc.id, { active: v });
                    setShareLink(updated);
                    toast.success(v ? "Share link enabled" : "Share link disabled");
                  }}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/25 px-3 py-2.5">
                <div>
                  <div className="font-semibold text-foreground">Show Email & Phone on Link</div>
                  <div className="text-[11px] text-muted-foreground">
                    Turn off to redact personal contact details for public/Reddit feedback.
                  </div>
                </div>
                <Switch
                  checked={shareLink.showContact}
                  onCheckedChange={async (v) => {
                    const updated = await apiUpsertShareLink(doc.id, { showContact: v });
                    setShareLink(updated);
                    toast.success(v ? "Contact details visible on link" : "Contact details hidden on link");
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/s/${shareLink.token}`
                      : `/s/${shareLink.token}`
                  }
                  className="h-9 flex-1 font-mono text-[11px]"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-lg text-xs"
                  onClick={() => {
                    const url = `${window.location.origin}/s/${shareLink.token}`;
                    navigator.clipboard?.writeText(url);
                    toast.success("Live share link copied to clipboard");
                  }}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-lg text-xs"
                  onClick={() => window.open(`/s/${shareLink.token}`, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </ResponsiveModal>

      {/* MASTER PROFILE MODAL */}
      <ResponsiveModal
        open={masterOpen}
        onOpenChange={setMasterOpen}
        title="Master Profile Sync"
        description="Maintain one master career profile and push contact details across all your tailored resumes in one click."
      >
        <div className="space-y-3 text-xs">
          <div className="rounded-xl border border-border bg-muted/30 p-3.5">
            {masterBusy && !masterProfile ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading Master Profile...
              </div>
            ) : masterProfile && masterProfile.contact?.name ? (
              <div className="space-y-1">
                <div className="font-semibold text-foreground">{masterProfile.contact.name}</div>
                <div className="text-muted-foreground">
                  {masterProfile.contact.role || "No title"} · {masterProfile.contact.email || "No email"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Stored: {masterProfile.experience.length} roles · {masterProfile.education.length} education ·{" "}
                  {masterProfile.skills.length} skills · Updated{" "}
                  {new Date(masterProfile.updatedAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                Your Master Profile is empty. Save this resume as your Master Profile to reuse it across tailored applications.
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Button
              size="sm"
              className="w-full justify-between rounded-xl"
              disabled={masterBusy}
              onClick={handleSaveToMaster}
            >
              <span>Save Current Resume to Master Profile</span>
              <UserCheck className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="w-full justify-between rounded-xl"
              disabled={masterBusy}
              onClick={handleSyncContactToAll}
            >
              <span>Sync Current Contact Details to All Saved Resumes</span>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="w-full justify-between rounded-xl"
              disabled={masterBusy || !masterProfile?.contact?.name}
              onClick={handlePullFromMaster}
            >
              <span>Pull Master Profile into This Resume</span>
              <Database className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </ResponsiveModal>

      {/* TRANSLATE MODAL */}
      <ResponsiveModal
        open={translateOpen}
        onOpenChange={setTranslateOpen}
        title="Translate Resume"
        description="In which language would you like to translate your resume section headings and content?"
        footer={
          <Button
            className="rounded-full"
            disabled={translating}
            onClick={async () => {
              setTranslating(true);
              try {
                const res = await apiTranslateResume({
                  content: doc.content,
                  targetLanguage: targetLang,
                });
                if (res.translated) {
                  handlePatchContent(res.translated);
                  toast.success(`Neural AI translated your resume to ${targetLang}`);
                } else {
                  translateDoc(doc.id, targetLang);
                  toast.success(`Translated template headings & text to ${targetLang}`);
                }
                setTranslateOpen(false);
              } catch {
                translateDoc(doc.id, targetLang);
                toast.success(`Translated to ${targetLang}`);
                setTranslateOpen(false);
              } finally {
                setTranslating(false);
              }
            }}
          >
            {translating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Translate to {targetLang}
          </Button>
        }
      >
        <Field label="Target Language">
          <Select value={targetLang} onValueChange={setTargetLang}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </ResponsiveModal>
    </div>
  );
}