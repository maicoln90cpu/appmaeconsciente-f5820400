import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";

const THEME_COLORS = {
  light: "#F8EDEE",
  dark: "#121212"
} as const;

const updateThemeColor = (theme: "light" | "dark") => {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
  const metaThemeColorLight = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
  const metaThemeColorDark = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
  
  // Update all theme-color meta tags
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", THEME_COLORS[theme]);
  }
  if (metaThemeColorLight) {
    metaThemeColorLight.setAttribute("content", THEME_COLORS[theme]);
  }
  if (metaThemeColorDark) {
    metaThemeColorDark.setAttribute("content", THEME_COLORS[theme]);
  }
};

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    updateThemeColor(initialTheme);
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem("theme");
      // Only auto-switch if user hasn't manually set a preference
      if (!savedTheme) {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        updateThemeColor(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const newTheme = theme === "light" ? "dark" : "light";
    
    // Add transition class for smooth color changes
    document.documentElement.style.setProperty("--theme-transition", "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease");
    
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    updateThemeColor(newTheme);
    
    // Remove transition after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [theme, isTransitioning]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      disabled={isTransitioning}
      className="relative transition-all duration-200 hover:scale-110 hover:bg-accent/50"
      aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
    >
      <Sun className={`h-5 w-5 absolute transition-all duration-300 ${
        theme === "dark" 
          ? "rotate-0 scale-100 opacity-100" 
          : "rotate-90 scale-0 opacity-0"
      }`} />
      <Moon className={`h-5 w-5 transition-all duration-300 ${
        theme === "light" 
          ? "rotate-0 scale-100 opacity-100" 
          : "-rotate-90 scale-0 opacity-0"
      }`} />
    </Button>
  );
};
