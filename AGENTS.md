<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## ReLeaf project rules

- Scoring, Safety Gate, matching and plant logic live as pure functions in `src/lib/releaf/` with tests beside them; pages only render their results — keeps safety rules testable and consistent across pages.
- Dashboard pages share state (factory, date range, selected sample, shared IoT reading) through `ReleafProvider` in the `/dashboard` layout — one source of truth for the selected sample.
- The ESP32/Wokwi mirror lives in `src/lib/releaf/iot/`; `hardware.ts` and `logic.ts` must match the original Wokwi project's `diagram.json` and `main.py` exactly — never add parts or change formulas/thresholds without the source project changing.
- IoT readings enter ReLeaf only via `iotToWaterSample`, which marks unmeasured (SAR, temperature) and estimated (EC) fields; all consumers must honour `isMeasured`/`isEstimated` instead of reading placeholder numbers.
- Telemetry adapters (MQTT/HTTP) are contracts only; never show a connected/live status unless a verified link exists.
- All figures are simulated or illustrative and must be labelled as such; no claims of certified safety, live AI, real sensors or lab results.
- The standalone 3D plant simulation is served as-is from `public/simulation/relief-3d.html` and embedded by the `/simulation` route in an iframe — keeps the user's original three.js build untouched.
- Admin screens live under `src/routes/_authenticated/admin.*`; every save goes through `useAdminAction` (toast + invalidate `["releaf"]`) and page access uses `can()` from `src/lib/releaf/admin.ts`, which mirrors the database policies — the database stays the real gate.
- Site name and logo come from the single `site_settings` row, read once by the root route loader (`getBrand`) and consumed via `useBrand()` in components and `pageMeta`/`withBrand` in head(); copy writes the default name and passes through `brandText` — so an admin rename reaches every page without code changes. Logos are stored as small data URLs because the workspace blocks public storage buckets; the built-in default logo is `public/brand/releaf-logo.png` (plain public file, not a CDN pointer) so it loads on any host, including Vercel.
