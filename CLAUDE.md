# CLAUDE.md - Shop Floor Management System

## Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build production bundle
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - *Not configured, add when implemented*

## Code Style Guidelines
- **Component structure**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Types**: Define props interfaces, use types from `/src/types/index.ts`
- **State management**: Context API for global state, useState for local
- **Imports order**: React/Next → external libs → internal absolute → relative
- **Error handling**: Try/catch with typed responses `{ success: boolean, error?: string }`
- **Component patterns**: Dialog flow controllers separate from UI components
- **API routes**: RESTful patterns, consistent JSON response format
- **File organization**: Components in `/components`, utilities in `/utils`
- **Client components**: Add "use client" directive where needed

*This document is maintained for agentic coding assistants working in this repository.*