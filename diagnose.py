# diagnose.py  —  run:  python diagnose.py           (fast, ~3s)
#                       python diagnose.py --deep    (also runs tsc, ~1-3min)
import json, os, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).parent
DEEP = "--deep" in sys.argv
ISSUES = []


def add(sev, cat, msg):
    ISSUES.append((sev, cat, msg))


def read(p):
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""


def rel(p):
    try:
        return str(Path(p).relative_to(ROOT)).replace("\\", "/")
    except Exception:
        return str(p)


def run(cmd, timeout=200):
    try:
        r = subprocess.run(cmd, shell=True, cwd=ROOT, capture_output=True, text=True,
                           timeout=timeout, encoding="utf-8", errors="replace")
        return (r.stdout or "") + (r.stderr or "")
    except subprocess.TimeoutExpired:
        return "__TIMEOUT__"
    except Exception as e:
        return "__ERR__ " + str(e)


EXPECTED = {
    "app/globals.css": 120, "app/layout.tsx": 18, "app/login/page.tsx": 28,
    "app/(app)/layout.tsx": 3, "app/(app)/page.tsx": 150,
    "app/(app)/documents/page.tsx": 100, "app/(app)/editor/[id]/page.tsx": 260,
    "app/(app)/templates/page.tsx": 65, "app/(app)/checker/page.tsx": 100,
    "app/(app)/jobs/page.tsx": 125, "app/(app)/tracker/page.tsx": 150,
    "app/(app)/auto-apply/page.tsx": 145, "app/(app)/interviews/page.tsx": 95,
    "app/(app)/ai/page.tsx": 42, "app/(app)/ai/career-map/page.tsx": 60,
    "app/(app)/ai/linkedin/page.tsx": 40, "app/(app)/tools/page.tsx": 120,
    "app/(app)/pricing/page.tsx": 100, "app/(app)/settings/page.tsx": 145,
    "app/(app)/help/page.tsx": 42,
    "components/app-shell.tsx": 160, "components/doc-card.tsx": 110,
    "components/magicui.tsx": 35, "components/shared.tsx": 100,
    "hooks/use-media-query.ts": 10, "lib/catalog.ts": 55, "lib/store.tsx": 110,
}

UI = ["button", "badge", "card", "input", "textarea", "label", "separator", "skeleton",
      "table", "avatar", "progress", "switch", "slider", "checkbox", "radio-group",
      "tabs", "accordion", "select", "scroll-area", "tooltip", "dialog", "sheet",
      "drawer", "dropdown-menu", "command", "sonner"]

TRIGGER_OWNER = {
    "Button": "button", "SheetTrigger": "sheet", "DialogTrigger": "dialog",
    "DrawerTrigger": "drawer", "DropdownMenuTrigger": "dropdown-menu",
    "TooltipTrigger": "tooltip", "DropdownMenuSubTrigger": "dropdown-menu",
}

BASEUI_MARKERS = ["@base-ui-components", "ButtonPrimitive", ".Trigger.Props",
                  ".Close.Props", ".Content.Props", ".Root.Props", ".Item.Props"]

PALETTE = {"--background": "#f1efe9", "--card": "#ffffff", "--primary": "#5d6f61",
           "--secondary": "#eaf0ea", "--accent": "#f6e3da", "--border": "#e4e2d8"}
CUSTOM_TOKENS = ["--peach", "--peach-soft", "--sage", "--sage-soft", "--sage-mist",
                 "--sage-line", "--cream", "--sidebar"]


def sources():
    out = []
    for base in ("app", "components", "lib", "hooks"):
        d = ROOT / base
        if not d.is_dir():
            continue
        for dp, dn, fn in os.walk(d):
            dn[:] = [x for x in dn if x not in ("node_modules", ".next", ".git")]
            for f in fn:
                if f.endswith((".ts", ".tsx", ".css")):
                    out.append(Path(dp) / f)
    return out


# ---------- 1. structure ----------
def check_structure():
    for f in ("package.json", "tsconfig.json", "next.config.ts", "postcss.config.mjs"):
        if not (ROOT / f).exists():
            alt = list(ROOT.glob(f.split(".")[0] + ".*"))
            if not alt:
                add("ERROR", "structure", f + " is missing")
    for f, minlines in EXPECTED.items():
        p = ROOT / f
        if not p.exists():
            add("ERROR", "missing", f)
        else:
            n = len(read(p).rstrip().splitlines())
            if n < minlines * 0.7:
                add("ERROR", "truncated", f + " has " + str(n) + " lines, expected ~" + str(minlines))
    for u in UI:
        if not (ROOT / "components/ui" / (u + ".tsx")).exists():
            add("WARN", "ui-missing", "components/ui/" + u + ".tsx")
    if (ROOT / "app/page.tsx").exists() and (ROOT / "app/(app)/page.tsx").exists():
        add("ERROR", "route", "app/page.tsx AND app/(app)/page.tsx both resolve to '/' — delete app/page.tsx")
    if not (ROOT / "lib/utils.ts").exists():
        add("ERROR", "missing", "lib/utils.ts (cn helper) — run: npx shadcn@latest init -d")
    gi = ROOT / ".gitignore"
    if not gi.exists():
        add("WARN", "git", ".gitignore missing")
    else:
        t = read(gi)
        for need in ("node_modules", ".next"):
            if need not in t:
                add("WARN", "git", ".gitignore does not ignore " + need)
    if not (ROOT / ".git").exists():
        add("WARN", "git", "not a git repository (run: git init -b main)")


# ---------- 2. file integrity ----------
def check_integrity(files):
    for p in files:
        t = read(p)
        if not t.strip():
            add("ERROR", "empty", rel(p))
            continue
        s = t.lstrip()
        if s.startswith("@'") or s.startswith('@"'):
            add("ERROR", "powershell", rel(p) + " starts with a here-string marker (@') — file is corrupt")
        if "'@" in t[-25:] or '"@' in t[-25:]:
            add("ERROR", "powershell", rel(p) + " ends with a here-string marker ('@)")
        if len(t) > 400 and t.count("\n") < 5:
            add("ERROR", "escaped", rel(p) + " has almost no newlines — literal \\n was written instead")
        try:
            if p.read_bytes().startswith(b"\xef\xbb\xbf") and p.suffix == ".json":
                add("ERROR", "bom", rel(p) + " has a UTF-8 BOM (breaks JSON parsers)")
        except Exception:
            pass
        if p.suffix in (".ts", ".tsx"):
            lines = [x for x in t.rstrip().splitlines() if x.strip()]
            last = lines[-1].strip() if lines else ""
            ok = last.startswith("}") or last.startswith("export") or last in (")", ");", "}", "};")
            if not ok:
                add("ERROR", "truncated", rel(p) + " ends mid-code: " + last[:70])
            if re.search(r"<[A-Za-z][A-Za-z0-9.]*\s*$", t.rstrip()):
                add("ERROR", "truncated", rel(p) + " ends with an unclosed JSX tag")


# ---------- 3. json configs ----------
def check_json():
    for f in ("package.json", "tsconfig.json"):
        p = ROOT / f
        if not p.exists():
            continue
        try:
            data = json.loads(read(p))
        except Exception as e:
            add("ERROR", "json", f + " invalid: " + str(e)[:90])
            continue
        if f == "tsconfig.json":
            paths = data.get("compilerOptions", {}).get("paths", {})
            if "@/*" not in paths:
                add("ERROR", "tsconfig", 'paths["@/*"] alias missing')
        else:
            for k in ("next", "react", "react-dom"):
                if k not in data.get("dependencies", {}):
                    add("ERROR", "package", k + " not in dependencies")
            if "dev" not in data.get("scripts", {}):
                add("ERROR", "package", 'scripts.dev missing')


# ---------- 4. dependencies ----------
def check_deps():
    p = ROOT / "package.json"
    if not p.exists():
        return
    try:
        data = json.loads(read(p))
    except Exception:
        return
    deps = dict(data.get("dependencies", {}))
    deps.update(data.get("devDependencies", {}))
    for name in sorted(deps):
        if not (ROOT / "node_modules" / name / "package.json").exists():
            add("ERROR", "not-installed", name + " (run npm install)")
    needed = set()
    for p2 in (ROOT / "components/ui").glob("*.tsx"):
        for m in re.finditer(r'from "(@radix-ui/[^"]+)"', read(p2)):
            needed.add(m.group(1))
    for n in sorted(needed):
        if not (ROOT / "node_modules" / n / "package.json").exists():
            add("ERROR", "not-installed", n + " required by components/ui")
    if (ROOT / "node_modules/@base-ui-components").exists():
        add("WARN", "base-ui", "@base-ui-components is installed — shadcn CLI shipped Base UI versions")


# ---------- 5. Base UI vs asChild ----------
def check_baseui(files):
    baseui = {}
    for p2 in (ROOT / "components/ui").glob("*.tsx"):
        t = read(p2)
        hits = [m for m in BASEUI_MARKERS if m in t]
        if hits:
            baseui[p2.stem] = hits
            add("ERROR", "base-ui", "components/ui/" + p2.name + " is Base UI (" + hits[0] + ") — does NOT support asChild")
    users = {}
    for p2 in files:
        if "components/ui" in rel(p2):
            continue
        t = read(p2)
        for i, line in enumerate(t.splitlines(), 1):
            for m in re.finditer(r"<([A-Za-z][A-Za-z0-9.]*)[^>]*\basChild\b", line):
                comp = m.group(1)
                users.setdefault(comp, []).append(rel(p2) + ":" + str(i))
    for comp, locs in users.items():
        owner = TRIGGER_OWNER.get(comp)
        if owner and owner in baseui:
            add("ERROR", "asChild", comp + " used with asChild but ui/" + owner + ".tsx is Base UI -> " + ", ".join(locs[:4]))
    for p2 in files:
        t = read(p2)
        for m in re.finditer(r"<([A-Za-z][A-Za-z0-9.]*)[^>]*\basChild\b[^>]*>(.{0,120})", t, re.S):
            inner = m.group(2).strip()
            single_expr = re.match(r"^\{[A-Za-z_$][\w.$]*\}", inner)
            if inner and not inner.startswith("<") and not single_expr:
                ln = t[:m.start()].count("\n") + 1
                add("ERROR", "slot", rel(p2) + ":" + str(ln) + " <" + m.group(1) + " asChild> has text+element children (Slot needs ONE element) — wrap in <Link>")


# ---------- 6. design tokens ----------
def check_tokens():
    p = ROOT / "app/globals.css"
    if not p.exists():
        return
    t = read(p)
    root = t.split(":root", 1)[1].split("}", 1)[0] if ":root" in t else ""
    for k, v in PALETTE.items():
        m = re.search(re.escape(k) + r"\s*:\s*([^;]+);", root)
        if not m:
            add("ERROR", "palette", k + " missing from :root")
        elif m.group(1).strip().lower() != v:
            add("ERROR", "palette", k + " = " + m.group(1).strip() + " (expected " + v + ") — shadcn init overwrote it")
    for k in CUSTOM_TOKENS:
        if k + ":" not in root:
            add("ERROR", "palette", k + " missing from :root")
        if "--color-" + k[2:] not in t:
            add("WARN", "palette", "--color-" + k[2:] + " not mapped in @theme (bg-" + k[2:] + " will not work)")
    if "@theme" not in t:
        add("ERROR", "palette", "@theme block missing from globals.css")
    if "--font-instrument-sans" not in t and "font-instrument-sans" not in read(ROOT / "app/layout.tsx"):
        add("ERROR", "fonts", "--font-instrument-sans is never defined -> body falls back to Times")
    for f in sources():
        if "next/font/google" in read(f):
            add("ERROR", "fonts", rel(f) + " uses next/font/google (blocked -> 30s+ compile hangs)")
    lay = read(ROOT / "app/layout.tsx")
    for m in re.finditer(r'from "(@fontsource[^"]*)"', lay):
        pkg = m.group(1).split("/")[0] + "/" + m.group(1).split("/")[1]
        if not (ROOT / "node_modules" / pkg).exists():
            add("ERROR", "fonts", pkg + " imported but not installed")


# ---------- 7. imports & icons ----------
def check_imports(files):
    exts = ["", ".tsx", ".ts", ".css", "/index.tsx", "/index.ts"]
    for p in files:
        t = read(p)
        for m in re.finditer(r'from "@/([^"]+)"', t):
            target = m.group(1)
            if not any((ROOT / (target + e)).exists() for e in exts):
                ln = t[:m.start()].count("\n") + 1
                add("ERROR", "import", rel(p) + ":" + str(ln) + " -> @/" + target + " not found")
    dts = ROOT / "node_modules/lucide-react/dist/lucide-react.d.ts"
    if dts.exists():
        blob = read(dts)
        have = set(re.findall(r"\b([A-Z][A-Za-z0-9]*)\b", blob))
        for p in files:
            t = read(p)
            for m in re.finditer(r'import\s*\{([^}]+)\}\s*from\s*"lucide-react"', t, re.S):
                for raw in m.group(1).split(","):
                    name = raw.strip().split(" as ")[0].strip()
                    if name and name not in have:
                        add("ERROR", "icon", rel(p) + " imports '" + name + "' which lucide-react does not export")


# ---------- 8. react pitfalls ----------
def check_react(files):
    for p in files:
        t = read(p)
        if "components/ui" in rel(p):
            continue
        for m in re.finditer(r"<(Sheet|Dialog|Drawer)Trigger(?![^>]*asChild)[^>]*>\s*<Button", t):
            ln = t[:m.start()].count("\n") + 1
            add("ERROR", "nested-button", rel(p) + ":" + str(ln) + " Trigger without asChild wraps <Button> -> nested <button>")
    cmd = ROOT / "components/ui/command.tsx"
    if cmd.exists() and "DialogTitle" not in read(cmd):
        add("WARN", "a11y", "ui/command.tsx has no DialogTitle -> Radix console warning")
    for n in ("dialog", "sheet", "drawer"):
        p = ROOT / "components/ui" / (n + ".tsx")
        if p.exists() and "aria-describedby" not in read(p):
            add("WARN", "a11y", "ui/" + n + ".tsx: add aria-describedby={undefined} to Content to silence Radix warning")


# ---------- 9. environment ----------
def check_env():
    for cmd, label in (("node -v", "node"), ("npm -v", "npm")):
        o = run(cmd, 30).strip()
        if o.startswith("__") or not o:
            add("ERROR", "env", label + " not available")
    reg = run("npm config get registry", 30).strip()
    if "registry.npmjs.org" in reg:
        add("WARN", "env", "npm registry is registry.npmjs.org (blocked in IR) — use a mirror")
    if not (ROOT / "node_modules").exists():
        add("ERROR", "env", "node_modules missing — run npm install")


# ---------- 10. typescript ----------
def check_tsc():
    out = run("npx --yes tsc --noEmit --pretty false", 400)
    if out == "__TIMEOUT__":
        add("WARN", "tsc", "tsc timed out (>400s)")
        return
    errs = [l for l in out.splitlines() if re.search(r"\(\d+,\d+\):\s*error TS", l)]
    for l in errs[:45]:
        add("ERROR", "tsc", l.strip()[:200])
    if len(errs) > 45:
        add("ERROR", "tsc", "...and " + str(len(errs) - 45) + " more TypeScript errors")
    if not errs and "error TS" not in out:
        add("OK", "tsc", "no TypeScript errors")


def main():
    files = sources()
    check_structure()
    check_integrity(files)
    check_json()
    check_deps()
    check_baseui(files)
    check_tokens()
    check_imports(files)
    check_react(files)
    check_env()
    if DEEP:
        check_tsc()

    order = {"ERROR": 0, "WARN": 1, "OK": 2}
    ISSUES.sort(key=lambda x: (order[x[0]], x[1]))
    errs = [i for i in ISSUES if i[0] == "ERROR"]
    warns = [i for i in ISSUES if i[0] == "WARN"]

    lines = []
    lines.append("=== CAREERLY DIAGNOSTIC ===")
    lines.append("root: " + str(ROOT))
    lines.append("scanned: " + str(len(files)) + " source files | mode: " + ("deep" if DEEP else "fast"))
    lines.append("RESULT: " + str(len(errs)) + " errors, " + str(len(warns)) + " warnings")
    lines.append("")
    cat = None
    for sev, c, msg in ISSUES:
        if c != cat:
            lines.append("-- " + c + " " + "-" * max(0, 50 - len(c)))
            cat = c
        lines.append("[" + sev + "] " + msg)
    if not ISSUES:
        lines.append("No problems found.")
    report = "\n".join(lines)

    print(report)
    (ROOT / "diagnose-report.txt").write_text(report, encoding="utf-8")
    (ROOT / "diagnose-report.json").write_text(
        json.dumps([{"severity": s, "category": c, "message": m} for s, c, m in ISSUES],
                   ensure_ascii=False, indent=2), encoding="utf-8")
    print("\nSaved: diagnose-report.txt  /  diagnose-report.json")
    if not DEEP:
        print("For real compile errors run:  python diagnose.py --deep")


if __name__ == "__main__":
    main()