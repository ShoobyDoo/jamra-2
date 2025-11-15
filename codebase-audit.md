# Codebase Audit Plan

Follow each task in order. Update the checkbox status and add notes as work completes so this file becomes the living log for both phases.

## Phase 1 – Recon & `codebase.md`

1. [x] **Directory + module inventory** – enumerate every top-level area (frontend, backend, electron, docs, configs) and record entry points plus build outputs. _Complete → see `codebase.md` “Directory & Module Inventory”._
2. [x] **Tooling + config snapshot** – capture package scripts, tsconfig hierarchy, lint/test tooling, build targets, environment expectations. _Complete → see `codebase.md` “Tooling & Config Snapshot”._
3. [x] **Shared types & schema catalog** – list every exported interface/type/enum (e.g., duplicate `ExtensionManifest` defs) with ownership, consumers, and mismatches. _Complete → see `codebase.md` “Shared Types & Schema Catalog”._
4. [x] **Frontend architecture doc** – describe routing, major components, hooks/state, data flows, and integration points. _Complete → see `codebase.md` “Frontend Architecture”._
5. [x] **Backend architecture doc** – document Express routes, DB access (better-sqlite3), migrations, SDK utilities, and API contracts. _Complete → see `codebase.md` “Backend Architecture”._
6. [x] **Electron layer doc** – outline main/preload responsibilities, IPC channels, packaging config, and resource bundling. _Complete → see `codebase.md` “Electron Architecture”._
7. [x] **Build/test/dev automation** – log dev workflows, scripts (`pnpm dev`, `pnpm dev:server`, etc.), CI workflows, manual test expectations. _Complete → see `codebase.md` “Build/Test/Dev Automation”._
8. [x] **Outstanding TODOs + risk notes** – summarize known issues, logs, or TODO comments discovered during recon to seed Phase 2. _Complete → see `codebase.md` “Outstanding TODOs & Risk Notes”._

## Phase 2 – Issue Catalog & Remediation Plan

9. [x] **Severity rubric** – define CRITICAL/HIGH/MEDIUM/LOW/QOL criteria tied to impact/tests. _Complete → see `codebase.md` “Severity Rubric”._
10. [x] **Issue inventory** – using `codebase.md`, list every inconsistency or duplication with severity, affected modules, and references to the doc sections. _Complete → see `codebase.md` “Issue Inventory”._
11. [x] **Remediation ordering** – prioritize issues, note prerequisites, recommended fixes, and validation steps. _Complete → see `codebase.md` “Remediation Ordering”._
12. [x] **Preventative guardrails** – propose governance (shared type package, lint rules, CI checks, doc refresh cadence) to stop regressions. _Complete → see `codebase.md` “Preventative Guardrails”._
