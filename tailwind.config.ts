import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem'
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px'
        }
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
  safelist: [
    // Church site template classes — arbitrary hex values that Tailwind JIT
    // can't detect inside string constants in church-site-types.ts
    "bg-[#1a365d]", "bg-[#0f1f33]", "text-[#1a365d]", "from-[#1a365d]", "to-[#2d4a7a]",
    "bg-[#c9a84c]", "text-[#c9a84c]", "hover:bg-[#b8963f]",
    "bg-[#2c1810]", "bg-[#1a0f09]", "text-[#8b4513]", "from-[#2c1810]", "to-[#4a2c17]",
    "bg-[#8b4513]", "hover:bg-[#7a3c10]",
    "bg-[#0a0a0a]", "bg-[#050505]", "bg-[#111]", "bg-[#111]/50",
    "text-[#ff6b35]", "from-[#0a0a0a]", "to-[#1a1a2e]", "border-[#333]",
    "bg-[#ff6b35]", "hover:bg-[#e85a28]",
    "bg-[#3d5a40]", "bg-[#2a3d2c]", "text-[#dda15e]", "from-[#3d5a40]", "to-[#5a7a5e]",
    "bg-[#dda15e]", "hover:bg-[#cc9048]",
    "bg-[#5b4a6e]", "bg-[#3d2f50]", "text-[#a78bba]", "from-[#5b4a6e]", "to-[#7b6a8e]",
    "bg-[#a78bba]", "hover:bg-[#967aaa]",
    "bg-[#7a1b1b]", "bg-[#4a0e0e]", "text-[#d4a853]", "from-[#7a1b1b]", "to-[#5a1010]",
    "bg-[#d4a853]", "hover:bg-[#c2973f]",
    "bg-[#b8860b]", "bg-[#8a6508]", "text-[#e8a020]", "from-[#b8860b]", "to-[#d4a030]",
    "bg-[#e8a020]", "hover:bg-[#d09018]",
    "bg-[#1a7a6d]", "bg-[#0f5a50]", "text-[#e07a5f]", "from-[#1a7a6d]", "to-[#2a9a8d]",
    "bg-[#e07a5f]", "hover:bg-[#cc6a50]",
    "bg-[#4a6fa5]", "bg-[#2a4a75]", "text-[#8899aa]", "from-[#4a6fa5]", "to-[#3a5f95]",
    "bg-[#8899aa]", "hover:bg-[#778899]",
    "bg-[#6b1d3a]", "bg-[#4a1028]", "text-[#b87333]", "from-[#6b1d3a]", "to-[#4a1028]",
    "bg-[#b87333]", "hover:bg-[#a06328]",
    "bg-[#283593]", "bg-[#1a237e]", "text-[#5c6bc0]", "from-[#283593]", "to-[#3949ab]",
    "bg-[#5c6bc0]", "hover:bg-[#4a5ab0]",
    "bg-[#8b7355]", "bg-[#6a5a42]", "text-[#2e8b8b]", "from-[#8b7355]", "to-[#6a5a42]",
    "bg-[#2e8b8b]", "hover:bg-[#257a7a]",
    "bg-[#4a2060]", "bg-[#2a1040]", "text-[#d4a030]", "from-[#4a2060]", "to-[#6a3090]",
    "bg-[#d4a030]", "hover:bg-[#c09020]",
    "bg-[#1e6091]", "bg-[#0f4061]", "text-[#d4a574]", "from-[#1e6091]", "to-[#2a80b1]",
    "bg-[#d4a574]", "hover:bg-[#c0945a]",
    "bg-[#1c1c1c]", "bg-[#0c0c0c]", "text-[#84cc16]", "from-[#1c1c1c]", "to-[#2c2c2c]",
    "bg-[#84cc16]", "hover:bg-[#72b810]",
    "bg-[#2d5a3d]", "bg-[#1d3a2d]", "text-[#8fbc8f]", "from-[#2d5a3d]", "to-[#1d4a2d]",
    "bg-[#8fbc8f]", "hover:bg-[#7aac7a]",
    "bg-[#3d4451]", "bg-[#2a3040]", "text-[#c77d8a]", "from-[#3d4451]", "to-[#4d5461]",
    "bg-[#c77d8a]", "hover:bg-[#b06d7a]",
    "bg-[#4a4a4a]", "bg-[#2a2a2a]", "text-[#d4af37]", "from-[#4a4a4a]", "to-[#3a3a3a]",
    "bg-[#d4af37]", "hover:bg-[#c0a027]",
    "bg-[#f5e6d3]", "bg-[#f0e0d0]/50", "text-[#b8860b]",
    "bg-[#faf6ee]", "bg-[#faf6ee]/50",
    "bg-[#fffef5]", "bg-[#fffef5]/50",
    "bg-[#fdf8f4]", "bg-[#fdf8f4]/50",
    "bg-[#fdf8ff]",
    "bg-[#f8fbff]",
    "bg-[#fafafa]",
    "bg-[#f8faf5]",
    "bg-[#f8f7f9]",
    "bg-[#f8f9fb]",
    "bg-[#f0f3f7]",
  ],
} satisfies Config;
