# Google Stitch Design System Specification — boshqaruvchi-ai-v1

Project Name: **boshqaruvchi-ai-v1**  
Author: Google Stitch AI & Antigravity  
Version: 1.0.0  

---

## 🎨 1. Design DNA & Color Palette

| Token Name | Hex / Value | Description |
| :--- | :--- | :--- |
| `--stitch-bg-dark` | `#07090e` | Deep obsidian main background |
| `--stitch-surface` | `rgba(15, 18, 28, 0.75)` | Glassmorphic container background |
| `--stitch-border` | `rgba(255, 255, 255, 0.1)` | Subtle glass card outline |
| `--stitch-border-glow` | `rgba(0, 242, 254, 0.35)` | Neon cyan border highlight |
| `--stitch-accent-cyan` | `#00f2fe` | Primary action accent color |
| `--stitch-accent-purple` | `#8a2be2` | Secondary gradient accent |
| `--stitch-accent-green` | `#10b981` | Success indicators & positive metrics |
| `--stitch-text-primary` | `#ffffff` | High contrast headings |
| `--stitch-text-secondary` | `rgba(226, 232, 240, 0.75)` | Body text and descriptions |

---

## 📐 2. Layout & Glassmorphism Rules

1. **Backdrop Blur Filter**: `backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);`
2. **Card Elevation**: `box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.6);`
3. **Pill Badges**: `border-radius: 99px; padding: 0.4rem 1rem; border: 1px solid var(--stitch-border-glow);`
4. **Border Radius System**:
   - Container Cards: `1.5rem` (`24px`)
   - Interactive Buttons: `99px` (Full Pill) or `0.75rem` (`12px`)
   - Small Badges: `0.5rem` (`8px`)

---

## 🚀 3. Screen Specifications (Project: boshqaruvchi-ai-v1)

### Screen 1: Navigation & Hero Area
- **Header**: Glassmorphic sticky navbar with glowing logo badge and action links.
- **Hero Title**: High-impact gradient heading with dual-tone neon highlight.
- **CTA Actions**: Neon cyan primary button with glowing shadow (`box-shadow: 0 0 25px rgba(0, 242, 254, 0.4)`).

### Screen 2: SaaS Info & Dashboard Card Mockup
- **Split Layout**: Left side contains headline and email signup form.
- **Right Side**: Interactive floating dashboard card showing live monthly revenue, tax calculations (3% QQS), and AI suggestions.

### Screen 3: Feature Bento Grid
- **6 Core Cards**: AI Advisor, SaaS Accounting, HR & FaceID Attendance, Legal Data Room, Tax Automation, and Multi-device support.
- **Hover Micro-interaction**: `transform: translateY(-4px)` with soft glow pulse.

### Screen 4: Pricing Tiers
- **Monthly / Yearly Switcher**: Interactive pill toggle.
- **3 Plan Cards**: Starter, Pro (Popular badge with glowing border), Enterprise.

---

## ⚡ 4. Code Output Standard
All Stitch UI components are generated in clean Next.js React TSX using CSS Modules, preserving 100% of existing functionality and data.
