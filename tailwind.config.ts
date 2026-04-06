import type { Config } from "tailwindcss";

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
  		fontFamily: {
  			sans: [
  				'Inter',
  				'-apple-system',
  				'system-ui',
  				'Segoe UI',
  				'Roboto',
  				'Oxygen',
  				'Ubuntu',
  				'Cantarell',
  				'Helvetica Neue',
  				'sans-serif'
  			],
  			mono: [
  				'ui-monospace',
  				'SFMono-Regular',
  				'SF Mono',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'monospace'
  			]
  		},
  		colors: {
  			border: 'rgb(var(--border))',
  			input: 'rgb(var(--input))',
  			ring: 'rgb(var(--ring))',
  			background: 'rgb(var(--background))',
  			foreground: 'rgb(var(--foreground))',
  			primary: {
  				DEFAULT: 'rgb(var(--primary))',
  				foreground: 'rgb(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'rgb(var(--secondary))',
  				foreground: 'rgb(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'rgb(var(--destructive))',
  				foreground: 'rgb(var(--destructive-foreground))'
  			},
  			success: {
  				DEFAULT: 'rgb(var(--success))',
  				foreground: 'rgb(var(--success-foreground))'
  			},
  			warning: {
  				DEFAULT: 'rgb(var(--warning))',
  				foreground: 'rgb(var(--warning-foreground))'
  			},
  			muted: {
  				DEFAULT: 'rgb(var(--muted))',
  				foreground: 'rgb(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'rgb(var(--accent))',
  				foreground: 'rgb(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'rgb(var(--popover))',
  				foreground: 'rgb(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'rgb(var(--card))',
  				foreground: 'rgb(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'rgb(var(--sidebar-background))',
  				foreground: 'rgb(var(--sidebar-foreground))',
  				primary: 'rgb(var(--sidebar-primary))',
  				'primary-foreground': 'rgb(var(--sidebar-primary-foreground))',
  				accent: 'rgb(var(--sidebar-accent))',
  				'accent-foreground': 'rgb(var(--sidebar-accent-foreground))',
  				border: 'rgb(var(--sidebar-border))',
  				ring: 'rgb(var(--sidebar-ring))'
  			},
  			chart: {
  				'1': 'rgb(var(--chart-1))',
  				'2': 'rgb(var(--chart-2))',
  				'3': 'rgb(var(--chart-3))',
  				'4': 'rgb(var(--chart-4))',
  				'5': 'rgb(var(--chart-5))'
  			},
  			/* Linear semantic tokens as Tailwind utilities */
  			'ln-brand':   '#5e6ad2',
  			'ln-accent':  '#7170ff',
  			'ln-page':    '#f7f8f8',
  			'ln-surface': '#ffffff',
  			'ln-panel':   '#f3f4f5',
  		},
  		borderRadius: {
  			none: '0px',
  			sm:   '4px',
  			DEFAULT: '6px',
  			md:   '6px',
  			lg:   '8px',
  			xl:   '12px',
  			'2xl': '22px',
  			full: '9999px'
  		},
  		boxShadow: {
  			ring:     'rgba(0,0,0,0.08) 0px 0px 0px 1px',
  			card:     'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 4px 0px',
  			elevated: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 4px 12px 0px',
  			subtle:   'rgba(0,0,0,0.04) 0px 2px 4px 0px',
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
  				from: {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'fade-in-up': {
  				from: {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'scale-in': {
  				from: {
  					opacity: '0',
  					transform: 'scale(0.95)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  			shimmer: {
  				from: {
  					transform: 'translateX(-100%)'
  				},
  				to: {
  					transform: 'translateX(100%)'
  				}
  			},
  			'pulse-glow': {
  				'0%, 100%': {
  					boxShadow: '0 0 20px hsl(var(--primary) / 0.2)'
  				},
  				'50%': {
  					boxShadow: '0 0 40px hsl(var(--primary) / 0.4)'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.5s ease-out',
  			'fade-in-up': 'fade-in-up 0.6s ease-out',
  			'scale-in': 'scale-in 0.3s ease-out',
  			shimmer: 'shimmer 2s infinite',
  			'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
