---
name: stitch-flow-ui
description: Google Stitch AI UI design & Google Flow creative media integration using MCP. Use when generating, extracting design DNA, or converting Google Stitch designs into React/Next.js code for Boshqaruvchi AI.
---

# Google Stitch & Flow MCP Skill

This skill enables seamless integration between Google Stitch (Google Labs AI-native UI design tool) and Google Flow (creative media studio) with the local Next.js frontend codebase (`Boshqaruvchi AI`).

## Configured Project Details
- **Project ID**: `boshqaruvchi-ai-v1`
- **Project Name**: `boshqaruvchi-ai-v1`
- **API Key Reference**: `STITCH_API_KEY` (in `.env`)

## Capabilities
1. **Design DNA Extraction**: Extract color palettes, typography specs, layout rules, and component tokens from Google Stitch project `boshqaruvchi-ai-v1`.
2. **Component Code Synthesis**: Convert Stitch UI mockups into clean, responsive Next.js React components using Vanilla CSS/CSS Modules without deleting existing data.
3. **Flow Media Stitching**: Embed generative media assets created via Google Flow (veo video loops, Imagen 3 backgrounds) into Stitch-designed components.

## Workflow
1. Sync Stitch Project `boshqaruvchi-ai-v1` specifications via `stitch` MCP tools.
2. Parse Design DNA (`DESIGN.md` rules and CSS variables).
3. Apply Stitch UI design tokens across existing Next.js components in `src/components/` and CSS Modules in `src/app/`.
