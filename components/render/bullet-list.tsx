"use client";

import React, { useEffect, useRef, useState } from "react";

const BULLET_LIST_CSS = `
.tpl-bullet-list {
  margin: 0;
  list-style-type: disc;
  list-style-position: outside;
}
.tpl-bullet-list > li {
  position: relative;
}
.tpl-bullet-list > li::marker {
  font-size: var(--bl-marker-size, 10.5pt);
  color: var(--bl-marker-color, #000000);
}
.tpl-bullet-ed {
  border-radius: 2px;
  outline: none;
  transition: background-color 0.12s ease, box-shadow 0.12s ease;
}
.tpl-bullet-ed:hover {
  background-color: rgba(93, 111, 97, 0.08);
  box-shadow: 0 0 0 1px rgba(93, 111, 97, 0.35);
}
.tpl-bullet-ed:focus {
  outline: none;
  background-color: rgba(93, 111, 97, 0.07);
  box-shadow: 0 0 0 1.5px #5d6f61;
}
.tpl-bullet-ed:empty::before {
  content: attr(data-ph);
  opacity: 0.35;
}
.tpl-bullet-del {
  position: absolute;
  right: -13pt;
  top: 0;
  width: 12pt;
  height: 12pt;
  border: none;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.92);
  color: #7a837c;
  font-family: Arial, sans-serif;
  font-size: 9pt;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s ease, color 0.12s ease, background-color 0.12s ease;
  z-index: 15;
}
.tpl-bullet-li:hover .tpl-bullet-del,
.tpl-bullet-li:focus-within .tpl-bullet-del {
  opacity: 1;
}
.tpl-bullet-del:hover {
  color: #b91c1c;
  background: #fee2e2;
}
.tpl-bullet-add {
  position: absolute;
  left: 13.5pt;
  bottom: -6pt;
  border: 1px dashed rgba(93, 111, 97, 0.55);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.96);
  color: #46574a;
  font-family: Arial, sans-serif;
  font-size: 7.5pt;
  line-height: 1.2;
  padding: 1.5pt 6pt;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease, background-color 0.12s ease;
  z-index: 20;
}
.tpl-bullet-wrap:hover .tpl-bullet-add,
.tpl-bullet-wrap:focus-within .tpl-bullet-add,
.tpl-bullet-wrap[data-empty="1"] .tpl-bullet-add {
  opacity: 1;
  pointer-events: auto;
}
.tpl-bullet-add:hover {
  background: #eaf0ea;
}
@media print {
  .tpl-bullet-wrap,
  .tpl-bullet-list,
  .tpl-bullet-list > li {
    position: static !important;
  }
  .tpl-bullet-del,
  .tpl-bullet-add {
    display: none !important;
  }
  .tpl-bullet-ed,
  .tpl-bullet-ed:hover,
  .tpl-bullet-ed:focus {
    background-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }
}
`;

export function BulletStylesOnce() {
  return <style dangerouslySetInnerHTML={{ __html: BULLET_LIST_CSS }} />;
}

function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return (el.innerText || "").length;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) return (el.innerText || "").length;
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  return pre.toString().length;
}

function focusElement(el: HTMLElement | null, toEnd: boolean) {
  if (!el) return;
  el.focus();
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(!toEnd);
  sel.removeAllRanges();
  sel.addRange(range);
}

function BulletTextCell({
  value,
  editable,
  placeholder,
  lineHeight,
  registerRef,
  onCommit,
  onEnterSplit,
  onBackspaceEmpty,
  onBlurEmpty,
}: {
  value: string;
  editable: boolean;
  placeholder: string;
  lineHeight: string;
  registerRef: (el: HTMLDivElement | null) => void;
  onCommit: (next: string) => void;
  onEnterSplit: (before: string, after: string) => void;
  onBackspaceEmpty: () => void;
  onBlurEmpty: () => void;
}) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const focusedRef = useRef(false);

  useEffect(() => {
    const el = localRef.current;
    if (el && !focusedRef.current && el.innerText !== (value || "")) {
      el.innerText = value || "";
    }
  }, [value]);

  if (!editable) {
    return <div style={{ minHeight: lineHeight }}>{value}</div>;
  }

  return (
    <div
      ref={(node) => {
        localRef.current = node;
        registerRef(node);
      }}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      data-ph={placeholder}
      className="tpl-bullet-ed"
      style={{
        minHeight: lineHeight,
        cursor: "text",
        whiteSpace: "pre-wrap",
      }}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={(e) => {
        focusedRef.current = false;
        const next = (e.currentTarget.innerText || "").replace(/\r/g, "").replace(/\n+$/, "");
        if (!next.trim()) {
          onBlurEmpty();
        } else if (next !== value) {
          onCommit(next);
        }
      }}
      onKeyDown={(e) => {
        const el = e.currentTarget;
        if (e.key === "Escape") {
          e.preventDefault();
          el.innerText = value || "";
          el.blur();
          return;
        }
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const full = (el.innerText || "").replace(/\r/g, "");
          const offset = getCaretOffset(el);
          const before = full.slice(0, offset).replace(/\n+$/, "");
          const after = full.slice(offset).replace(/^\n+/, "");
          el.innerText = before;
          onEnterSplit(before, after);
          return;
        }
        if (e.key === "Backspace") {
          const cur = (el.innerText || "").replace(/\r/g, "");
          if (cur.trim().length === 0) {
            e.preventDefault();
            onBackspaceEmpty();
          }
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        const txt = e.clipboardData.getData("text/plain").replace(/\r/g, "");
        document.execCommand("insertText", false, txt);
      }}
    />
  );
}

export function EditableBulletList({
  bullets,
  editable = false,
  onChange,
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight = 400,
  color = "#000000",
  marginTop,
  markerSizePt = 10.6,
  ulPaddingLeftPt = 13.5,
  liPaddingLeftPt = 1.5,
  placeholder = "Type bullet point... (Enter for new bullet)",
}: {
  bullets: string[];
  editable?: boolean;
  onChange?: (next: string[]) => void;
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  fontWeight?: number;
  color?: string;
  marginTop?: string;
  markerSizePt?: number;
  ulPaddingLeftPt?: number;
  liPaddingLeftPt?: number;
  placeholder?: string;
}) {
  const [items, setItems] = useState<string[]>(bullets);
  const prevPropKeyRef = useRef<string>(JSON.stringify(bullets));
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pendingFocusRef = useRef<{ idx: number; toEnd: boolean } | null>(null);

  useEffect(() => {
    const key = JSON.stringify(bullets);
    if (key !== prevPropKeyRef.current) {
      prevPropKeyRef.current = key;
      setItems(bullets);
    }
  }, [bullets]);

  useEffect(() => {
    if (pendingFocusRef.current) {
      const { idx, toEnd } = pendingFocusRef.current;
      pendingFocusRef.current = null;
      const el = itemRefs.current[idx];
      if (el) {
        if (el.innerText !== (items[idx] || "")) {
          el.innerText = items[idx] || "";
        }
        focusElement(el, toEnd);
      }
    }
  }, [items]);

  const commit = (nextRaw: string[]) => {
    const cleaned = nextRaw
      .map((s) => s.replace(/\r/g, "").replace(/\n+$/, ""))
      .filter((s) => s.trim().length > 0);
    prevPropKeyRef.current = JSON.stringify(cleaned);
    onChange?.(cleaned);
  };

  if (!editable && items.length === 0) return null;

  const ulStyle = {
    paddingLeft: `${ulPaddingLeftPt}pt`,
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    color,
    "--bl-marker-size": `${markerSizePt.toFixed(2)}pt`,
    "--bl-marker-color": color,
  } as React.CSSProperties;

  return (
    <div
      className="tpl-bullet-wrap"
      data-empty={items.length === 0 ? "1" : "0"}
      style={{
        position: "relative",
        marginTop: items.length > 0 ? marginTop : editable ? "2pt" : undefined,
        minHeight: items.length === 0 && editable ? "12pt" : undefined,
      }}
    >
      <BulletStylesOnce />
      {items.length > 0 && (
        <ul className="tpl-bullet-list" style={ulStyle}>
          {items.map((b, idx) => (
            <li
              key={idx}
              className="tpl-bullet-li"
              style={{
                paddingLeft: `${liPaddingLeftPt}pt`,
                margin: 0,
              }}
            >
              <BulletTextCell
                value={b}
                editable={editable && Boolean(onChange)}
                placeholder={placeholder}
                lineHeight={lineHeight}
                registerRef={(el) => {
                  itemRefs.current[idx] = el;
                }}
                onCommit={(nextVal) => {
                  const next = [...items];
                  next[idx] = nextVal;
                  setItems(next);
                  commit(next);
                }}
                onEnterSplit={(before, after) => {
                  const next = [...items];
                  next[idx] = before;
                  next.splice(idx + 1, 0, after);
                  pendingFocusRef.current = { idx: idx + 1, toEnd: false };
                  setItems(next);
                  commit(next);
                }}
                onBackspaceEmpty={() => {
                  const next = items.filter((_, i) => i !== idx);
                  if (next.length > 0) {
                    pendingFocusRef.current = { idx: Math.max(0, idx - 1), toEnd: true };
                  }
                  setItems(next);
                  commit(next);
                }}
                onBlurEmpty={() => {
                  if (pendingFocusRef.current) return;
                  const next = items.filter((_, i) => i !== idx);
                  setItems(next);
                  commit(next);
                }}
              />
              {editable && onChange && (
                <button
                  type="button"
                  className="tpl-bullet-del"
                  title="Remove bullet"
                  aria-label="Remove bullet"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const next = items.filter((_, i) => i !== idx);
                    setItems(next);
                    commit(next);
                  }}
                >
                  {"\u00d7"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editable && onChange && (
        <button
          type="button"
          className="tpl-bullet-add"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const next = [...items, ""];
            pendingFocusRef.current = { idx: next.length - 1, toEnd: false };
            setItems(next);
          }}
        >
          + Add bullet
        </button>
      )}
    </div>
  );
}