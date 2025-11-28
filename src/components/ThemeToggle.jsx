'use client';

import { Button } from "@/components/ui/button";
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import React from 'react'; // Added missing React import

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-label="Loading theme"
        disabled
      >
        <div className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <motion.div
      className="fixed top-4 right-4 z-50"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        className="rounded-full hover:bg-accent hover:text-accent-foreground"
      >
        {theme === 'light' ? (
          <Moon className="h-5 w-5 transition-all duration-300" />
        ) : (
          <Sun className="h-5 w-5 transition-all duration-300" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    </motion.div>
  );
};