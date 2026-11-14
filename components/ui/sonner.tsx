"use client"
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
