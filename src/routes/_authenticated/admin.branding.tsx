import { useRef, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ImageUp, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Field, NoAccess } from "@/components/admin/Field";
import { useAdmin } from "@/components/admin/admin-context";
import { PageHeader, Panel } from "@/components/releaf/Cards";
import { DEFAULT_LOGO_URL, LogoMark } from "@/components/releaf/Logo";
import { Button } from "@/components/ui/button";
import { useAdminAction } from "@/hooks/use-admin-data";
import { useBrand } from "@/hooks/use-brand";
import { supabase } from "@/integrations/supabase/client";
import { can } from "@/lib/releaf/admin";
import { DEFAULT_BRAND_NAME, LOGO_MAX_CHARS, LOGO_MAX_PX, logoError, SITE_NAME_MAX, siteNameSchema } from "@/lib/releaf/brand";
import { pageMeta } from "@/lib/releaf/meta";

export const Route = createFileRoute("/_authenticated/admin/branding")({
  head: ({ matches }) => pageMeta(matches, "Site name & logo · Admin", "Change the website name and logo shown across RELEAF."),
  component: BrandingAdmin,
});

/** Shrinks any picked image to at most LOGO_MAX_PX on its longest side and returns a PNG (or WebP if PNG is too big). */
async function fileToLogo(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file (PNG, JPG, WebP or SVG)");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image is larger than 10 MB");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That image could not be read"));
      el.src = url;
    });
    const w0 = img.naturalWidth || LOGO_MAX_PX;
    const h0 = img.naturalHeight || LOGO_MAX_PX;
    const scale = Math.min(1, LOGO_MAX_PX / Math.max(w0, h0));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w0 * scale));
    canvas.height = Math.max(1, Math.round(h0 * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not process the image");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let out = canvas.toDataURL("image/png");
    if (out.length > LOGO_MAX_CHARS) out = canvas.toDataURL("image/webp", 0.85);
    const err = logoError(out);
    if (err) throw new Error(err);
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function BrandingAdmin() {
  const { roles, user } = useAdmin();
  const brand = useBrand();
  const router = useRouter();
  const { run, busy } = useAdminAction();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(brand.name);
  const [logo, setLogo] = useState<string | null>(brand.logoUrl);
  const [nameError, setNameError] = useState<string>();
  const [reading, setReading] = useState(false);

  if (!can(roles, "branding")) return <NoAccess what="the site name and logo" />;

  const dirty = name.trim() !== brand.name || logo !== brand.logoUrl;

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setReading(true);
    try {
      setLogo(await fileToLogo(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That image could not be used");
    } finally {
      setReading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const p = siteNameSchema.safeParse(name);
    if (!p.success) return setNameError(p.error.issues[0]?.message);
    setNameError(undefined);
    const ok = await run(
      () =>
        supabase
          .from("site_settings")
          .upsert({ id: 1, site_name: p.data, logo_data_url: logo, updated_by: user.id })
          .select("id"),
      "Site name and logo saved",
    );
    if (ok) {
      setName(p.data);
      await router.invalidate();
    }
  }

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      <PageHeader
        eyebrow="Admin"
        title="Site name & logo"
        description="Shown in the header, footer, dashboard, admin panel, page titles and the browser tab for every visitor."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={!dirty || busy}
              onClick={() => { setName(brand.name); setLogo(brand.logoUrl); setNameError(undefined); }}
            >
              Discard changes
            </Button>
            <Button type="submit" variant="forest" disabled={busy || reading || !dirty}>{busy ? "Saving…" : "Save"}</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Site name" subtitle={`Up to ${SITE_NAME_MAX} characters`}>
          <div className="space-y-3">
            <Field
              id="site-name"
              label="Website name"
              value={name}
              maxLength={SITE_NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              error={nameError}
              hint={`Default: ${DEFAULT_BRAND_NAME}`}
            />
            <Button type="button" variant="ghost" size="sm" disabled={name === DEFAULT_BRAND_NAME} onClick={() => setName(DEFAULT_BRAND_NAME)}>
              <RotateCcw /> Use {DEFAULT_BRAND_NAME}
            </Button>
          </div>
        </Panel>

        <Panel title="Logo" subtitle={`Square images look best · shrunk to ${LOGO_MAX_PX}px automatically`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid size-24 place-items-center rounded-xl border bg-card">
              <img src={logo ?? DEFAULT_LOGO_URL} alt="Logo preview" className="size-20 object-contain" />
            </div>
            <div className="flex flex-col gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} aria-label="Upload logo" />
              <Button type="button" variant="outline" disabled={reading} onClick={() => fileRef.current?.click()}>
                <ImageUp /> {reading ? "Processing…" : "Upload new logo"}
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={logo === null} onClick={() => setLogo(null)}>
                <RotateCcw /> Use the default logo
              </Button>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Preview" subtitle={dirty ? "Unsaved — this is how the header will look" : "This is what visitors see now"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2.5 rounded-xl border bg-background px-4 py-3">
            <LogoMark src={logo ?? DEFAULT_LOGO_URL} />
            <span className="truncate text-[1.15rem] font-semibold tracking-tight text-foreground">{name.trim() || DEFAULT_BRAND_NAME}</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-sidebar px-4 py-3">
            <LogoMark src={logo ?? DEFAULT_LOGO_URL} />
            <span className="truncate text-[1.15rem] font-semibold tracking-tight text-on-dark">{name.trim() || DEFAULT_BRAND_NAME}</span>
          </div>
        </div>
      </Panel>
    </form>
  );
}
