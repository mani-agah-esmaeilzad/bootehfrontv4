import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // hrbooteh custom colors
        "hrbooteh-primary": "hsl(var(--hrbooteh-primary))",
        "hrbooteh-primary-foreground": "hsl(var(--hrbooteh-primary-foreground))",
        "hrbooteh-primary-hover": "hsl(var(--hrbooteh-primary-hover))",
        "hrbooteh-accent": "hsl(var(--hrbooteh-accent))",
        "hrbooteh-accent-foreground": "hsl(var(--hrbooteh-accent-foreground))",
        "hrbooteh-background": "hsl(var(--hrbooteh-background))",
        "hrbooteh-surface": "hsl(var(--hrbooteh-surface))",
        "hrbooteh-surface-elevated": "hsl(var(--hrbooteh-surface-elevated))",
        "hrbooteh-text-primary": "hsl(var(--hrbooteh-text-primary))",
        "hrbooteh-text-secondary": "hsl(var(--hrbooteh-text-secondary))",
        "hrbooteh-text-muted": "hsl(var(--hrbooteh-text-muted))",
        "hrbooteh-success": "hsl(var(--hrbooteh-success))",
        "hrbooteh-success-foreground": "hsl(var(--hrbooteh-success-foreground))",
        "hrbooteh-warning": "hsl(var(--hrbooteh-warning))",
        "hrbooteh-warning-foreground": "hsl(var(--hrbooteh-warning-foreground))",
        "hrbooteh-chat-ai": "hsl(var(--hrbooteh-chat-ai))",
        "hrbooteh-chat-ai-border": "hsl(var(--hrbooteh-chat-ai-border))",
        "hrbooteh-chat-user": "hsl(var(--hrbooteh-chat-user))",
        "hrbooteh-chat-user-foreground": "hsl(var(--hrbooteh-chat-user-foreground))",

        // Default shadcn colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        sans: ['Vazirmatn', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        vazir: ['Vazirmatn', 'sans-serif'],
      },
      backgroundImage: {
        'hrbooteh-gradient-primary': 'var(--hrbooteh-gradient-primary)',
        'hrbooteh-gradient-subtle': 'var(--hrbooteh-gradient-subtle)',
        'hrbooteh-gradient-success': 'var(--hrbooteh-gradient-success)',
      },
      boxShadow: {
        'hrbooteh-sm': 'var(--hrbooteh-shadow-sm)',
        'hrbooteh-md': 'var(--hrbooteh-shadow-md)',
        'hrbooteh-lg': 'var(--hrbooteh-shadow-lg)',
      },
      transitionProperty: {
        'hrbooteh': 'var(--hrbooteh-transition)',
        'hrbooteh-fast': 'var(--hrbooteh-transition-fast)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "pulse-gentle": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.8",
          },
        },
        "slide-up": {
          from: {
            transform: "translateY(10px)",
            opacity: "0",
          },
          to: {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        "slide-in": {
          from: {
            transform: "translateX(10px)",
            opacity: "0",
          },
          to: {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-gentle": "pulse-gentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
