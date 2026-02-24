"use client"

"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { LayoutDashboard, Receipt, Tag, Wallet, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/incomes",
    label: "Transactions",
    icon: Receipt,
  },
  {
    href: "/categories",
    label: "Categories",
    icon: Tag,
  },
]

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    getUser()
  }, [supabase.auth])

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup function to reset on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  async function handleLogout() {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 transform border-r bg-card transition-transform duration-200 ease-in-out lg:static lg:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Logo/Title - Better spacing on mobile with close button */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b px-6">
            <h1 className="text-xl font-bold">Expense Tracker</h1>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden rounded-lg p-2 hover:bg-accent touch-manipulation"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links - Larger touch targets */}
          <nav className="flex-1 overflow-y-auto space-y-2 px-4 py-6">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors touch-manipulation
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80"
                    }
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* User Info and Logout - Better mobile spacing */}
          <div className="shrink-0 border-t p-4 bg-card safe-area-inset-bottom">
            <div className="mb-3 rounded-xl bg-muted px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Signed in as</p>
              <p className="truncate text-sm font-medium">{userEmail}</p>
            </div>
            <Button
              onClick={handleLogout}
              disabled={isLoading}
              variant="outline"
              className="w-full justify-start gap-3 h-12 text-base touch-manipulation"
            >
              <LogOut className="h-5 w-5" />
              {isLoading ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content - Better mobile padding */}
      <main className={`flex-1 relative ${isMobileMenuOpen ? 'overflow-hidden' : 'overflow-auto'}`}>
        {/* Mobile menu button - Positioned at top of content, scrolls away, hidden when menu is open */}
        {!isMobileMenuOpen && (
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden absolute top-3 left-3 z-50 rounded-lg p-3 bg-card border shadow-lg hover:bg-accent touch-manipulation"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 pb-safe pt-16 lg:pt-4">{children}</div>
      </main>
    </div>
  )
}
