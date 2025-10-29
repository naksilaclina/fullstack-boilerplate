"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--success)", // Use CSS variable for consistency
          "--success-text": "var(--success-foreground)",
          "--success-border": "var(--success)",
          "--error-bg": "var(--error)",
          "--error-text": "var(--error-foreground)",
          "--error-border": "var(--error)",
          "--warning-bg": "var(--warning)",
          "--warning-text": "var(--warning-foreground)",
          "--warning-border": "var(--warning)",
          "--info-bg": "var(--info)",
          "--info-text": "var(--info-foreground)",
          "--info-border": "var(--info)",
          "--border-radius": "var(--radius)",
          // Ensure proper contrast for all toast types
          "--success-shadow": "0 4px 12px oklch(0 0 0 / 0.1)",
          "--error-shadow": "0 4px 12px oklch(0 0 0 / 0.1)",
          "--warning-shadow": "0 4px 12px oklch(0 0 0 / 0.1)",
          "--info-shadow": "0 4px 12px oklch(0 0 0 / 0.1)",
          // Consistent padding and spacing
          "--toast-padding": "16px",
          "--toast-gap": "8px",
        } as React.CSSProperties
      }
      toastOptions={{
        duration: 5000,
        classNames: {
          toast: "toast group toast-custom",
          description: "toast-description",
          actionButton: "toast-action",
          cancelButton: "toast-cancel",
        },
      }}
      // Limit the number of toasts displayed at once to prevent overcrowding
      visibleToasts={3}
      // Enable keyboard navigation support with Alt+T as the hotkey
      hotkey={["Alt", "T"]}
      // Enable rich colors for better visual distinction
      richColors={true}
      {...props}
    />
  )
}

export { Toaster }