import type { Config } from "tailwindcss";
import { colorPalette } from "./src/lib/design-system";
// @ts-ignore
import tailwindAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
				'xl': '1280px',
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				heading: ['Inter', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					...colorPalette.primary
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					...colorPalette.secondary
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					...colorPalette.accent
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				neutral: colorPalette.neutral,
				success: colorPalette.state.success,
				warning: colorPalette.state.warning,
				error: colorPalette.state.error,
				info: colorPalette.state.info,
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
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
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				'slide-in': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(20px)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' },
				},
				'slide-in-left': {
					'0%': { transform: 'translateX(-20px)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' },
				},
				'slide-in-top': {
					'0%': { transform: 'translateY(-20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				'slide-in-bottom': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				'pulse-primary': {
					'0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 160, 122, 0.4)' },
					'50%': { boxShadow: '0 0 0 8px rgba(0, 160, 122, 0)' },
				},
				'pulse-secondary': {
					'0%, 100%': { boxShadow: '0 0 0 0 rgba(39, 117, 242, 0.4)' },
					'50%': { boxShadow: '0 0 0 8px rgba(39, 117, 242, 0)' },
				},
				'pulse-accent': {
					'0%, 100%': { boxShadow: '0 0 0 0 rgba(254, 71, 18, 0.4)' },
					'50%': { boxShadow: '0 0 0 8px rgba(254, 71, 18, 0)' },
				},
				'bounce-subtle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' },
				},
				'rotate-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' },
				},
				'ping': {
					'75%, 100%': {
						transform: 'scale(2)',
						opacity: '0',
					},
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' },
				},
				'pop': {
					'0%': { transform: 'scale(0.95)', opacity: '0.5' },
					'50%': { transform: 'scale(1.05)' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s ease-out',
				'slide-in': 'slide-in 0.5s ease-out',
				'slide-in-right': 'slide-in-right 0.5s ease-out',
				'slide-in-left': 'slide-in-left 0.5s ease-out',
				'slide-in-top': 'slide-in-top 0.5s ease-out',
				'slide-in-bottom': 'slide-in-bottom 0.5s ease-out',
				'pulse-primary': 'pulse-primary 2s infinite',
				'pulse-secondary': 'pulse-secondary 2s infinite',
				'pulse-accent': 'pulse-accent 2s infinite',
				'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
				'rotate-slow': 'rotate-slow 8s linear infinite',
				'ping': 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
				'float': 'float 3s ease-in-out infinite',
				'pop': 'pop 0.3s ease-out',
			},
			boxShadow: {
				'primary-glow': '0 0 15px rgba(0, 160, 122, 0.5)',
				'primary-glow-lg': '0 0 30px rgba(0, 160, 122, 0.6)',
				'secondary-glow': '0 0 15px rgba(39, 117, 242, 0.5)',
				'secondary-glow-lg': '0 0 30px rgba(39, 117, 242, 0.6)',
				'accent-glow': '0 0 15px rgba(254, 71, 18, 0.5)',
				'accent-glow-lg': '0 0 30px rgba(254, 71, 18, 0.6)',
				'glassmorphism': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
			},
			backdropBlur: {
				xs: '2px',
				sm: '4px',
				md: '8px',
				lg: '12px',
				xl: '16px',
				'2xl': '24px',
			},
		}
	},
	plugins: [tailwindAnimate],
} satisfies Config;
