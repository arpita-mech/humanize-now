import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";

interface ControlsPanelProps {
  tone: string;
  onToneChange: (tone: string) => void;
}

const tones = [
  { value: "auto", label: "Auto" },
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "academic", label: "Academic" },
  { value: "friendly", label: "Friendly" },
];

export function ControlsPanel({ tone, onToneChange }: ControlsPanelProps) {
  return (
    <div className="flex items-end gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Tone
        </Label>
        <Select value={tone} onValueChange={onToneChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tones.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
