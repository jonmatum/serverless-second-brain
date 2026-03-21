import { useState } from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { api } from "@/lib/api";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TypeBadge, StatusBadge, TagBadge } from "@/components/badges";

const TYPES = ["concept", "note", "experiment", "essay"];

interface CaptureResult { slug: string; title: string; node_type: string; status: string; tags: string[]; }

export default function Capture() {
  const { user, token, login } = useAuth();
  const { locale } = usePrefs();
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("concept");
  const [lang, setLang] = useState<"es" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CaptureResult | null>(null);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <h1 className="text-2xl font-bold">{t("capture.title", locale)}</h1>
        <p className="text-muted-foreground text-center max-w-sm">{t("capture.login_required", locale)}</p>
        <Button onClick={login} className="gap-2">
          <LogIn className="h-4 w-4" />
          {t("auth.login", locale)}
        </Button>
      </div>
    );
  }

  const charCount = text.length;
  const valid = charCount >= 50;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !token) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await api.capture({ text, url: url || undefined, type, language: lang }, token);
      setResult(res); setText(""); setUrl("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      if (msg.includes("401")) { login(); return; }
      setError(msg);
    } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("capture.title", locale)}</h1>

      {result && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">{t("capture.success", locale)}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{result.title}</span>
              <TypeBadge type={result.node_type} /><StatusBadge status={result.status} />
            </div>
            <div className="flex flex-wrap gap-1.5">{result.tags.map((tg) => <TagBadge key={tg} tag={tg} />)}</div>
            <Link to={`/node?id=${result.slug}`} className="inline-block text-sm text-primary hover:underline">{t("capture.view_node", locale)}</Link>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="capture-text" className="text-sm font-medium">{t("capture.text_label", locale)}</label>
              <textarea id="capture-text" value={text} onChange={(e) => setText(e.target.value)} rows={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                placeholder={t("capture.text_placeholder", locale)} />
              <p className={`text-xs ${valid ? "text-muted-foreground" : "text-destructive"}`}>{t("capture.char_count", locale, { count: charCount })}</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="capture-url" className="text-sm font-medium">{t("capture.url_label", locale)}</label>
              <Input id="capture-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("capture.type_label", locale)}</label>
                <Select value={type} onValueChange={(v: string | null) => v && setType(v)}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((tp) => <SelectItem key={tp} value={tp}>{t(`type.${tp}` as Parameters<typeof t>[0], locale)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("capture.lang_label", locale)}</label>
                <Select value={lang} onValueChange={(v: string | null) => v && setLang(v as "es" | "en")}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="es">ES</SelectItem><SelectItem value="en">EN</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={!valid || loading} className="w-full sm:w-auto">
              {loading ? t("capture.submitting", locale) : t("capture.submit", locale)}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
