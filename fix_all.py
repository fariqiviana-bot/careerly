# fix_all.py  —  run:  python fix_all.py
import pathlib, re, subprocess, sys, shutil

ROOT = pathlib.Path(__file__).parent
F = {}

F["components/ui/accordion.tsx"] = r'''"use client"
import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function Accordion(props: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}
function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cn("border-b border-border last:border-b-0", className)} {...props} />
}
function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn("flex flex-1 cursor-pointer items-start justify-between gap-4 py-4 text-left text-sm font-medium outline-none transition-all hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180", className)}
        {...props}
      >
        {children}
        <ChevronDownIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}
function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      {...props}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
'''

F["components/ui/avatar.tsx"] = r'''"use client"
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return <AvatarPrimitive.Root data-slot="avatar" className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)} {...props} />
}
function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image data-slot="avatar-image" className={cn("aspect-square size-full object-cover", className)} {...props} />
}
function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return <AvatarPrimitive.Fallback data-slot="avatar-fallback" className={cn("flex size-full items-center justify-center rounded-full bg-muted text-sm font-medium", className)} {...props} />
}

export { Avatar, AvatarImage, AvatarFallback }
'''

F["components/ui/checkbox.tsx"] = r'''"use client"
import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn("peer size-4 shrink-0 cursor-pointer rounded-[5px] border border-input bg-card shadow-xs outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <CheckIcon className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
'''

F["components/ui/progress.tsx"] = r'''"use client"
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

function Progress({ className, value, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 rounded-full bg-primary transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
'''

F["components/ui/radio-group.tsx"] = r'''"use client"
import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { CircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("grid gap-3", className)} {...props} />
}
function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn("aspect-square size-4 shrink-0 cursor-pointer rounded-full border border-input bg-card shadow-xs outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary", className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <CircleIcon className="size-2 fill-primary text-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
'''

F["components/ui/switch.tsx"] = r'''"use client"
import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn("peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-sage-line", className)}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0.5" />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
'''

F["components/ui/slider.tsx"] = r'''"use client"
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

function Slider({ className, defaultValue, value, min = 0, max = 100, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min]),
    [value, defaultValue, min]
  )
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn("relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block size-4 shrink-0 cursor-grab rounded-full border-2 border-primary bg-white shadow-sm outline-none transition-transform hover:scale-110 focus-visible:ring-[3px] focus-visible:ring-ring/40 active:cursor-grabbing disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
'''

F["components/ui/tabs.tsx"] = r'''"use client"
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-2 data-[orientation=vertical]:md:flex-row", className)} {...props} />
}
function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn("inline-flex h-9 w-fit items-center justify-center rounded-full bg-muted p-1 text-muted-foreground", className)} {...props} />
}
function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn("inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    />
  )
}
function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
'''

F["components/ui/scroll-area.tsx"] = r'''"use client"
import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "@/lib/utils"

function ScrollArea({ className, children, ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}
function ScrollBar({ className, orientation = "vertical", ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn("flex touch-none select-none p-px transition-colors", orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent", orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent", className)}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-sage-soft transition-colors hover:bg-sage" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
'''

F["components/ui/select.tsx"] = r'''"use client"
import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}
function SelectGroup(props: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}
function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}
function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn("flex h-9 w-full cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-60" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}
function SelectContent({ className, children, position = "popper", ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        className={cn("relative z-50 max-h-[min(22rem,var(--radix-select-content-available-height))] min-w-[8rem] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-[0_16px_40px_rgba(43,47,42,0.14)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95", position === "popper" && "w-[var(--radix-select-trigger-width)] data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1", className)}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}
function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)} {...props} />
}
function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn("relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
}
function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton className={cn("flex cursor-default items-center justify-center py-1", className)} {...props}>
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}
function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton className={cn("flex cursor-default items-center justify-center py-1", className)} {...props}>
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton }
'''

F["components/ui/drawer.tsx"] = r'''"use client"
import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/lib/utils"

function Drawer(props: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}
function DrawerTrigger(props: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}
function DrawerPortal(props: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}
function DrawerClose(props: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}
function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn("fixed inset-0 z-50 bg-[#2b2f2a]/35 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className)}
      {...props}
    />
  )
}
function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        aria-describedby={undefined}
        className={cn("fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[88vh] flex-col rounded-t-2xl border border-border bg-card shadow-[0_-16px_50px_rgba(43,47,42,0.18)] outline-none", className)}
        {...props}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-sage-line" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}
function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-header" className={cn("flex flex-col gap-1.5 p-4 text-left", className)} {...props} />
}
function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
}
function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return <DrawerPrimitive.Title data-slot="drawer-title" className={cn("font-serif text-2xl leading-none text-foreground", className)} {...props} />
}
function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return <DrawerPrimitive.Description data-slot="drawer-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export { Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription }
'''

F["components/ui/sonner.tsx"] = r'''"use client"
import * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="light"
    position="top-center"
    className="toaster group"
    style={{ "--normal-bg": "var(--card)", "--normal-text": "var(--foreground)", "--normal-border": "var(--border)", "--border-radius": "0.875rem" } as React.CSSProperties}
    toastOptions={{
      classNames: {
        toast: "!rounded-xl !border-border !bg-card !text-foreground !shadow-[0_16px_40px_rgba(43,47,42,0.14)]",
        description: "!text-muted-foreground",
        actionButton: "!bg-primary !text-primary-foreground !rounded-full",
        cancelButton: "!bg-muted !text-muted-foreground !rounded-full",
      },
    }}
    {...props}
  />
)

export { Toaster }
'''

GITIGNORE = """node_modules/
.next/
out/
build/
.swc/
.env
.env*.local
*.tsbuildinfo
next-env.d.ts
.vercel
.DS_Store
Thumbs.db
*.log
globals.backup.css
*.backup.*
.idea/
diagnose-report.json
"""

OLD_ICONS = '''    icons_dir = ROOT / "node_modules/lucide-react/dist/esm/icons"
    if icons_dir.is_dir():
        have = {f.stem for f in icons_dir.glob("*.js")}
        for p in files:
            t = read(p)
            for m in re.finditer(r'import\\s*\\{([^}]+)\\}\\s*from\\s*"lucide-react"', t, re.S):
                for raw in m.group(1).split(","):
                    name = raw.strip().split(" as ")[0].strip()
                    if not name:
                        continue
                    kebab = re.sub(r"(?<!^)(?=[A-Z])", "-", name).lower()
                    if kebab not in have and kebab.replace("-icon", "") not in have:
                        add("ERROR", "icon", rel(p) + " imports '" + name + "' which lucide-react does not export")'''

NEW_ICONS = '''    dts = ROOT / "node_modules/lucide-react/dist/lucide-react.d.ts"
    if dts.exists():
        blob = read(dts)
        have = set(re.findall(r"\\b([A-Z][A-Za-z0-9]*)\\b", blob))
        for p in files:
            t = read(p)
            for m in re.finditer(r'import\\s*\\{([^}]+)\\}\\s*from\\s*"lucide-react"', t, re.S):
                for raw in m.group(1).split(","):
                    name = raw.strip().split(" as ")[0].strip()
                    if name and name not in have:
                        add("ERROR", "icon", rel(p) + " imports '" + name + "' which lucide-react does not export")'''

OLD_SLOT = '''            inner = m.group(2).strip()
            if inner and not inner.startswith("<"):'''

NEW_SLOT = '''            inner = m.group(2).strip()
            single_expr = re.match(r"^\\{[A-Za-z_$][\\w.$]*\\}", inner)
            if inner and not inner.startswith("<") and not single_expr:'''


def sh(cmd, timeout=600):
    return subprocess.run(cmd, shell=True, cwd=ROOT, capture_output=True, text=True,
                          timeout=timeout, encoding="utf-8", errors="replace")


def main():
    print("== 1/7 installing Radix primitives ==")
    pkgs = ("@radix-ui/react-accordion @radix-ui/react-avatar @radix-ui/react-checkbox "
            "@radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area "
            "@radix-ui/react-select @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-tabs vaul")
    r = sh(f"npm i {pkgs} --no-audit --no-fund --legacy-peer-deps")
    if r.returncode != 0:
        print((r.stdout or "") + (r.stderr or ""))
        print("!! npm install failed — fix network, re-run this script.")
        sys.exit(1)
    print("  OK")

    print("\n== 2/7 writing Radix UI components ==")
    bad = []
    for relpath, src in F.items():
        p = ROOT / relpath
        p.parent.mkdir(parents=True, exist_ok=True)
        text = src.lstrip("\n")
        p.write_text(text, encoding="utf-8")
        lines = text.rstrip().splitlines()
        ok = lines[-1].strip().startswith("export")
        print(f"  {'OK ' if ok else 'BAD'} {relpath:38s} {len(lines):4d} lines")
        if not ok:
            bad.append(relpath)
    if bad:
        print("\n!! truncated:", bad, "— re-save fix_all.py as UTF-8 and re-run.")
        sys.exit(1)

    print("\n== 3/7 removing false positives from diagnose.py ==")
    d = ROOT / "diagnose.py"
    if d.exists():
        s = d.read_text(encoding="utf-8")
        for old, new, label in ((OLD_ICONS, NEW_ICONS, "icon check -> .d.ts aliases"),
                                (OLD_SLOT, NEW_SLOT, "slot check -> allow {element}")):
            if old in s:
                s = s.replace(old, new)
                print("  OK  " + label)
            elif new in s:
                print("  --  already patched: " + label)
            else:
                print("  ??  pattern not found: " + label)
        d.write_text(s, encoding="utf-8")
    else:
        print("  --  diagnose.py not found, skipped")

    print("\n== 4/7 git ==")
    gi = ROOT / ".gitignore"
    if not gi.exists():
        gi.write_text(GITIGNORE, encoding="utf-8")
        print("  OK  .gitignore created")
    else:
        cur = gi.read_text(encoding="utf-8")
        add_lines = [l for l in GITIGNORE.splitlines() if l and l not in cur]
        if add_lines:
            gi.write_text(cur.rstrip() + "\n" + "\n".join(add_lines) + "\n", encoding="utf-8")
            print("  OK  .gitignore extended")
        else:
            print("  --  .gitignore already complete")
    if not (ROOT / ".git").exists():
        g = sh("git init -b main", 60)
        print("  OK  git init" if g.returncode == 0 else "  ??  " + (g.stderr or "").strip())
    else:
        print("  --  already a git repository")

    print("\n== 5/7 clearing .next ==")
    shutil.rmtree(ROOT / ".next", ignore_errors=True)
    print("  OK")

    print("\n== 6/7 TypeScript check (this can take a minute) ==")
    t = sh("npx --yes tsc --noEmit --pretty false", 900)
    out = (t.stdout or "") + (t.stderr or "")
    errs = [l for l in out.splitlines() if re.search(r"\(\d+,\d+\):\s*error TS", l)]
    if errs:
        for l in errs[:40]:
            print("  [ERROR] " + l.strip()[:200])
        if len(errs) > 40:
            print(f"  ...and {len(errs) - 40} more")
    else:
        print("  OK  0 TypeScript errors")

    print("\n== 7/7 diagnostic ==")
    if d.exists():
        g = sh("python diagnose.py", 300)
        print((g.stdout or "") + (g.stderr or ""))
    print("\nDone. Start the app:  npm run dev   ->   http://localhost:3000")


if __name__ == "__main__":
    main()