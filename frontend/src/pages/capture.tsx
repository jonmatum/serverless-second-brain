import { useState } from "react";
import { Link } from "react-router-dom";
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
      <div className="space-y-4 text-center py-12">
        <h1 className="text-2xl font-bold">{t("capture.title", locale)}</h1>
        <p className="text-muted-foreground">{t("capture.login_required", locale)}</p>
        <Button onClick={login}>{t("auth.login", locale)}</Button>
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("capture.title", locale)}</h1>
      {result && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="p-3 sm:p-4 space-y-2">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">{t("capture.success", locale)}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{result.title}</span>
              <TypeBadge type={result.node_type} /><StatusBadge status={result.status} />
            </div>
            <div className="flex flex-wrap gap-1.5">{result.tags.map((tg) => <TagBadge key={tg} tag={tg} />)}</div>
            <Link to={`/node?id=${result.slug}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{t("capture.view_node", locale)}</Link>
          </CardContent>
        </Card>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="capture-text" className="text-sm font-medium">{t("capture.text_label", locale)}</label>
          <textarea id="capture-text" value={text} onChange={(e) => setText(e.target.value)} rows={6}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder={t("capture.text_placeholder", locale)} />
          <p className={`mt-1 text-xs ${valid ? "text-muted-foreground" : "text-destructive"}`}>{t("capture.char_count", locale, { count: charCount })}</p>
        </div>
        <div>
          <label htmlFor="capture-url" className="text-sm font-medium">{t("capture.url_label", locale)}</label>
          <Input id="capture-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="mt-1" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="text-sm font-medium">{t("capture.type_label", locale)}</label>
            <Select value={type} onValueChange={(v: string | null) => v && setType(v)}>
              <SelectTrigger className="mt-1 w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((tp) => <SelectItem key={tp} value={tp}>{t(`type.${tp}` as Parameters<typeof t>[0], locale)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">{t("capture.lang_label", locale)}</label>
            <Select value={lang} onValueChange={(v: string | null) => v && setLang(v as "es" | "en")}>
              <SelectTrigger className="mt-1 w-full sm:w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="es">ES</SelectItem><SelectItem value="en">EN</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" disabled={!valid || loading}>{loading ? t("capture.submitting", locale) : t("capture.submit", locale)}</Button>
      </form>
    </div>
  );
}
