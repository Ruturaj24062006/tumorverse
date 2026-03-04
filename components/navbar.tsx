"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Dna, BarChart3, FlaskConical, Activity, Menu, X } from "lucide-react"

const navLinks = [
  { href: "/", label: "Home", icon: Dna },
  { href: "/predict", label: "Predict", icon: FlaskConical },
  { href: "/tumor-twin", label: "Tumor Twin", icon: Activity },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00E5FF]/10 neon-border">
            <Dna className="h-5 w-5 text-[#00E5FF]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#00E5FF] neon-text font-sans">
            TumorVerse
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#00E5FF]/10 text-[#00E5FF]"
                    : "text-[#8899AA] hover:bg-[#00E5FF]/5 hover:text-[#00E5FF]/80"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8899AA] hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="glass-panel border-t border-[#00E5FF]/10 px-6 py-3 md:hidden">
          {navLinks.map((link) => {
            const Icon = link.icon
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#00E5FF]/10 text-[#00E5FF]"
                    : "text-[#8899AA] hover:text-[#00E5FF]/80"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
