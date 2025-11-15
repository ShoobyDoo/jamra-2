# Manual Verification Checklist

Native modules (better-sqlite3) and the embedded server require a quick manual pass whenever we ship a new packaged build. Run this checklist after producing a release artifact (or before cutting a release branch) to ensure the packaged app behaves like the dev stack.

## When to Run
- Before publishing a release build for any platform.
- After dependency bumps touching Electron, better-sqlite3, or the backend server.
- Whenever packaging fails in CI and you need to validate fixes locally.

> **Automation note:** CI (and local devs) can run `pnpm smoke:packaging` after `pnpm build:app` to ensure the compiled backend boots. The checklist below is still required because it validates the full packaged desktop shell plus native log locations.

## 1. Build & Package
```bash
# Install/update dependencies if needed
pnpm install

# Build renderer + backend bundles (no packaging)
pnpm build:app

# Create an installer/portable build for your current platform
pnpm build
```

Artifacts land in `src-tauri/target/release/`. Launch the installer/portable executable from there.

## 2. Launch the Packaged App
1. Install or unzip the artifact you built above.
2. Start JAMRA from the installed shortcut/executable.
3. Sign in if prompted and wait for the main window to render.
4. Leave the app running for the remainder of the checklist so the bundled server stays online.

## 3. Health Endpoint & Log Presence
With the packaged app still running:

```bash
# From the repo root
pnpm manual:health
```

This helper script (`scripts/manual-health-check.mjs`) performs two checks:
- Pings `http://localhost:${JAMRA_HEALTH_PORT:-3000}/health` and verifies the payload is `{ status: 'ok' }`.
- Ensures the desktop host log (`main.log`) and backend log (`server.log`) exist at the expected OS-specific path (see table below).

Environment overrides:

| Variable | Default | Purpose |
| --- | --- | --- |
| `JAMRA_HEALTH_URL` | `http://localhost:3000/health` | Override when the packaged server runs on a different host/port. |
| `JAMRA_HEALTH_PORT` | `3000` | Alternate port when only the port changes. |
| `JAMRA_HEALTH_TIMEOUT` | `5000` (ms) | Custom timeout for slow environments. |
| `JAMRA_LOG_PATH` | OS default path (see below) | Point to a non-standard log directory. |

### Default log + DB paths

| OS | Desktop Host Log | Server Log | `app.getPath('userData')` |
| --- | --- | --- | --- |
| Windows | `%APPDATA%/JAMRA/logs/main.log` | `%APPDATA%/JAMRA/logs/server.log` | `%APPDATA%/JAMRA/` |
| macOS | `~/Library/Application Support/JAMRA/logs/main.log` | `~/Library/Application Support/JAMRA/logs/server.log` | `~/Library/Application Support/JAMRA/` |
| Linux | `~/.config/JAMRA/logs/main.log` | `~/.config/JAMRA/logs/server.log` | `~/.config/JAMRA/` |

If the script reports a missing log, open the packaged app console (DevTools) or the `logs/` directory under `app.getPath('userData')` to inspect errors before proceeding.

## 4. Database & Migration Check
1. Navigate to the `userData` path listed above.
2. Confirm `data/manga.db` (or your configured DB file) exists.
3. Inspect the latest log entries for `Running pending migrations` to ensure the first boot migrated successfully.
4. Launch the reader UI and confirm library data matches expectations (i.e., catalog renders, downloads page loads without errors).

## 5. Health Endpoint (Browser)
With the packaged app still open, hit the health endpoint manually in a browser: `http://localhost:3000/health`. You should see `{"status":"ok"}`.

## 6. Optional: Tail Logs
- Windows PowerShell: `Get-Content "$env:APPDATA/JAMRA/logs/main.log" -Wait` (desktop host) / `Get-Content "$env:APPDATA/JAMRA/logs/server.log" -Wait` (Node server)
- macOS/Linux: `tail -f ~/Library/Application\ Support/JAMRA/logs/main.log` or `tail -f ~/Library/Application\ Support/JAMRA/logs/server.log` (replace with `~/.config` on Linux)

Look for:
- `initializeServer`: backend started (emitted by `main.log`)
- `Server listening` and `GET /api/` entries: renderer hitting the backend (`server.log`)
- `WebSocket server initialized`: real-time layer active

## 7. Close Down
1. Quit JAMRA from the tray menu (“Exit JAMRA”) so the backend shuts down cleanly.
2. Re-run `pnpm manual:health` to confirm the health endpoint now fails (verifies the script catches down services).
3. Document results in release notes/issue tracker as needed.

---

Additions or discoveries from the manual run (failures, unexpected logs, DB drift) should be captured in `docs/Troubleshooting-Windows.md` (or the OS-specific companion) so future runs know what to watch out for.
