# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

N-brace is an Obsidian plugin that provides interactive 2D graph navigation and visualization using react-force-graph-2d. It displays local graphs centered on the current note, allowing keyboard-based navigation through note connections.

## Build Commands

```bash
bun install          # Install dependencies
bun run dev          # Start development mode (watch mode with esbuild)
bun run build        # Production build
bun run typecheck    # TypeScript check + circular dependency detection (dpdm)
bun run lint         # ESLint with auto-fix
```

The build outputs `main.js` (bundled plugin) and `styles.css` to the root directory.

## Architecture

### Core Data Model (`src/graph/`)
- **Graph.ts**: Main graph structure with nodes/links arrays and indexed lookups. Created from Obsidian's metadata cache via `Graph.createFromApp()`. Supports filtering and traversal operations.
- **Node.ts**: Represents vault files with properties like path, name, links, neighbors, expansion state, and avatar images. Tracks inlink/outlink counts.
- **Link.ts**: Directed edges between nodes with source/target references and display properties (label, color, distance).

### State Management (`src/atoms/`)
- Uses **Jotai** for React state. Key atoms in `graphAtoms.ts`:
  - `graphDataAtom`: Current visible nodes/links
  - `graphNavAtom`: Selected node path/index
  - `navHistoryAtom`/`navIndexHistoryAtom`: Navigation history for arrow key traversal
  - `graphSettingsAtom`: Visual settings (colors, span)

### Plugin Entry (`src/main.ts`)
- `ForceGraphPlugin` extends Obsidian's Plugin class
- Maintains `globalGraph` (full vault graph) rebuilt when metadata cache changes
- Registers `ReactForceGraphView` as a custom view type
- Handles file opening, navigation sync, and hover link integration

### View Layer (`src/views/`)
- **ReactForceGraphView.tsx**: Obsidian ItemView that hosts the React component. Provides `expandNode()` and `implodeNode()` operations.
- **ReactForceGraph.tsx**: Main React component using ForceGraph2D. Handles keyboard navigation (arrow keys + Ctrl for direction toggle), node expansion, BFS-based graph filtering by distance.
- **Drawing.ts**: Custom canvas rendering for nodes (rectangles with labels, avatar images) and links (gradient width tapers).
- **GraphControls.tsx**: UI controls for navigation and settings.

### Key Patterns
- Path aliases: `@/*` maps to `src/*` (tsconfig paths)
- Event bus pattern (`src/util/EventBus.ts`) for cross-component communication (file opening, focus changes)
- Settings validated with Zod schemas (`src/SettingsSchemas.ts`)
- Nodes track `expanded` (children loaded) and `imploded` (paragraphs shown) states

### Navigation Flow
1. User navigates with arrow keys in the graph view
2. Up/Down: Move along parent-child hierarchy (Ctrl reverses direction)
3. Left/Right: Move to siblings at same level
4. Clicking unexpanded node loads its neighbors from `globalGraph`
5. Selected node opens in the left markdown pane

### Implode Feature
Expanding a node with "implode" parses note sections (headings) and shows paragraph-level nodes connected to their link targets.

## Pre-push Hook

The pre-push hook runs `typecheck`, `lint`, and `build`. Ensure all pass before pushing.
