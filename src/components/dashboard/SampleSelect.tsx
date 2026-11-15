import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReleaf } from "./releaf-context";

export function SampleSelect() {
  const { sampleId, setSampleId, samples } = useReleaf();
  return (
    <Select value={sampleId} onValueChange={setSampleId}>
      <SelectTrigger className="h-9 w-[280px] bg-card" aria-label="Water sample">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {samples.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            <span className="font-mono text-xs text-muted-foreground">{s.id}</span> · {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
