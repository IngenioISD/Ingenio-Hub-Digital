# Plan: Scaffold inicial de Ingenio-Hub-Digital

## Goal
Prepare the project base for **Ingenio-Hub-Digital**, an ERP for construction companies. No functional screens yet (no login, no dashboard, etc.); just the initial structure, branding, and folder layout so the next prompt can focus on the first screen.

## Current state
The project is already a TanStack Start + React 19 + Tailwind CSS v4 stack. shadcn/ui (New York style) and lucide-react are already installed and configured. The work remaining is mostly branding and structural scaffolding.

## Proposed work

1. **Project identity**
   - Update `package.json` name from `tanstack_start_ts` to `ingenio-hub-digital`.
   - Update `src/routes/__root.tsx` head metadata: title, description, and Open Graph/Twitter tags to reflect "Ingenio-Hub-Digital".

2. **Brand tokens in styles.css**
   - Add a small semantic brand color token `--color-ingenio` (e.g., a construction-appropriate amber/ochre) in both light and dark modes, so future screens can use `bg-ingenio`, `text-ingenio`, etc. without hardcoding hex values.
   - Keep the existing Tailwind v4 setup untouched.

3. **Replace placeholder home page**
   - Remove the Lovable placeholder image from `src/routes/index.tsx`.
   - Render only a minimal branded splash: project name, short tagline, and a "Coming soon" cue. This is not a functional screen, just a clean landing while the project is scaffolded.

4. **Folder structure for ERP modules**
   - Create empty/convention-only directories for future ERP areas:
     - `src/components/layout/` (future shell, sidebar, header)
     - `src/components/shared/` (reusable non-shadcn pieces)
     - `src/lib/erp/` (constants, types, helpers specific to the construction domain)
     - `src/types/` (global TypeScript types)
   - Keep directories empty or with a `README.md` so they commit cleanly.

5. **Verification**
   - Run `bun run build:dev` to confirm the project still compiles.
   - Confirm the dev server shows the branded splash page at `/`.

## Out of scope
- No authentication/login.
- No dashboard, CRUD, data tables, or backend schema.
- No Lovable Cloud or database setup until the first screen requires it.

## Next step
After approval, implement the scaffold and then wait for the next prompt describing the first screen.
