import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

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
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
					border: 'hsl(var(--border))',
					input: 'hsl(var(--input))',
					ring: 'hsl(var(--ring))',
					background: 'hsl(var(--background))',
					foreground: 'hsl(var(--foreground))',
					// Colores de marca - Paleta unificada slate
				brand: {
					primary: '#475569',     // Slate 600
					'primary-dark': '#334155',  // Slate 700
					'primary-light': '#64748b',  // Slate 500
					secondary: '#1e293b',   // Slate 800
					'secondary-dark': '#0f172a',  // Slate 900
					'secondary-light': '#475569',  // Slate 600
					accent: '#64748b',      // Slate 500
					'accent-dark': '#475569',  // Slate 600
					'accent-light': '#94a3b8',  // Slate 400
					// Compatibilidad con nombres anteriores
					indigo: "#475569",
					purple: "#1e293b",
					pink: "#475569",
					cyan: "#64748b",
					neutral: {
						50: '#f8fafc',
						100: '#f1f5f9',
						200: '#e2e8f0',
						300: '#cbd5e1',
						400: '#94a3b8',
						500: '#64748b',
						600: '#475569',
						700: '#334155',
						800: '#1e293b',
						900: '#0f172a'
					}
				},
				video: {
					primary: '#1e40af',
					secondary: '#374151',
					accent: '#059669',
					dark: '#0f172a',
					'dark-secondary': '#1e293b',
						gradient: "linear-gradient(135deg, #1e40af 0%, #374151 50%, #059669 100%)"
					},
				primary: {
					DEFAULT: 'hsl(var(--primary))', // Índigo moderno #6366f1
					foreground: 'hsl(var(--primary-foreground))',
					dark: 'hsl(var(--primary-dark))',
					light: 'hsl(var(--primary-light))',
					50: "#eef2ff",
					100: "#e0e7ff",
					500: "#6366f1",
					600: "#5b21b6",
					700: "#4c1d95"
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
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
					DEFAULT: 'hsl(var(--accent))', // Cyan para video #06b6d4
					foreground: 'hsl(var(--accent-foreground))',
					50: "#ecfeff",
					100: "#cffafe",
					500: "#06b6d4",
					600: "#0891b2",
					700: "#0e7490"
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
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
			backgroundImage: {
					'gradient-primary': 'var(--brand-gradient-primary)',
					'gradient-secondary': 'var(--brand-gradient-secondary)',
					'gradient-hero': 'var(--brand-gradient-hero)',
					'gradient-card': 'var(--gradient-card)',
					// Gradientes de marca - Nueva identidad
					'gradient-brand': 'linear-gradient(135deg, #1e40af 0%, #374151 100%)',
					'gradient-video': 'linear-gradient(45deg, #1e40af 0%, #374151 25%, #059669 50%, #1e40af 75%, #374151 100%)',
					'gradient-accent': 'var(--brand-gradient-accent)',
					'gradient-dark': 'var(--brand-gradient-dark)',
					'gradient-glow': 'var(--brand-gradient-glow)',
					'gradient-neon': 'var(--brand-gradient-neon)'
				},
			boxShadow: {
					'elegant': 'var(--shadow-elegant)',
					'strong': 'var(--shadow-strong)',
					'glow': 'var(--shadow-glow)',
					'glow-secondary': 'var(--shadow-glow-secondary)',
					'glow-accent': 'var(--shadow-glow-accent)',
					'video': 'var(--shadow-video)',
					'neon': 'var(--shadow-neon)',
					'electric': 'var(--shadow-electric)'
				},
			transitionTimingFunction: {
				'smooth': 'var(--transition-smooth)',
				'bounce': 'var(--transition-bounce)'
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
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
