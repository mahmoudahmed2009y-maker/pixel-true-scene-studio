import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, Info, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/releaf/Cards";
import { SampleSelect } from "@/components/dashboard/SampleSelect";
import { useReleaf } from "@/components/dashboard/releaf-context";
import { answer, SUGGESTED_QUESTIONS } from "@/lib/releaf/assistant";
import { pageMeta } from "@/lib/releaf/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/assistant")({
  head: () => pageMeta("AI Assistant", "Operator assistant that explains water readings, risk scores, Safety Gate restrictions and reuse options."),
  component: Assistant,
});

interface Msg {
  role: "user" | "assistant";
  text: string;
}

function Assistant() {
  const { sample, limits } = useReleaf();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hello — I'm the RELEAF operator assistant. Ask me about the selected sample's readings, risk score, restrictions or reuse options." },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  const ask = (q: string) => {
    if (!q.trim() || thinking) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", text: answer(q, sample, limits) }]);
      setThinking(false);
    }, 650);
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operator assistant" title="Ask about your water" actions={<SampleSelect />} />
      <div className="flex items-start gap-2 rounded-xl border border-dashed border-info/40 bg-info-soft p-3 text-xs text-info">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Rule-based demo assistant. Answers are generated from RELEAF's scoring rules and the selected sample — no live AI model or laboratory system is connected.
      </div>

      <div className="surface-card flex h-[62vh] min-h-[460px] flex-col overflow-hidden">
        <div className="flex-1 space-y-5 overflow-y-auto p-5 md:p-6">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div className={cn("grid size-8 shrink-0 place-items-center rounded-full", m.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-mint text-forest")}>
                {m.role === "assistant" ? <Bot className="size-4" /> : <User className="size-4" />}
              </div>
              <div
                className={cn(
                  "max-w-[78%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "assistant" ? "rounded-tl-sm bg-muted" : "rounded-tr-sm bg-primary text-primary-foreground",
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-3">
              <div className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Bot className="size-4" /></div>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d * 120}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="border-t bg-background/60 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button key={q} onClick={() => ask(q)} className="rounded-full border bg-card px-3 py-1.5 text-xs transition-colors hover:border-emerald hover:bg-mint">
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex gap-2"
          >
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Ask about sample ${sample.id}…`} className="h-11 bg-card" />
            <Button type="submit" variant="forest" className="h-11 px-5" disabled={!input.trim() || thinking}>
              <Send /> Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
