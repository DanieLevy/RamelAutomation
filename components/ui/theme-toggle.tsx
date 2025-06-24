import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Check if theme is saved in localStorage
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(systemPrefersDark ? "dark" : "light")
      document.documentElement.classList.toggle("dark", systemPrefersDark)
    }
  }, [])

  // Update when theme changes
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem("theme", theme)
    
    // Apply theme to HTML element
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    
    // Update theme-color meta tag for notch/status bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content", 
        theme === "dark" ? "#171717" : "#FFFFFF"
      )
    }
    
    // Update manifest link to use the appropriate theme
    const manifestLink = document.getElementById("manifest-link") as HTMLLinkElement
    if (manifestLink) {
      manifestLink.href = `/api/manifest?theme=${theme}`
    }
    
    // For installed PWAs, try to update theme via media query
    if (window.matchMedia('(display-mode: standalone)').matches) {
      document.documentElement.style.setProperty('--pwa-theme-color', theme === "dark" ? "#171717" : "#FFFFFF")
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={theme === "light" ? "עבור למצב כהה" : "עבור למצב בהיר"}
    >
      {theme === "light" ? (
        <Moon className="theme-icon" />
      ) : (
        <Sun className="theme-icon" />
      )}
      <span className="sr-only">
        {theme === "light" ? "עבור למצב כהה" : "עבור למצב בהיר"}
      </span>
    </Button>
  )
} 