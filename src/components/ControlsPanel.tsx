import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sparkles, Briefcase, MessageSquare, GraduationCap, Heart } from "lucide-react";

interface ControlsPanelProps {
  tone: string;
  onToneChange: (tone: string) => void;
}

const tones = [
  { value: "auto", label: "Auto", icon: Sparkles },
  { value: "professional", label: "Professional", icon: Briefcase },
  { value: "casual", label: "Casual", icon: MessageSquare },
  { value: "academic", label: "Academic", icon: GraduationCap },
  { value: "friendly", label: "Friendly", icon: Heart },
];

export function ControlsPanel({ tone, onToneChange }: ControlsPanelProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
        Tone
      </Label>
      <ToggleGroup
        type="single"
        value={tone}
        onValueChange={(v) => v && onToneChange(v)}
        className="gap-1 flex-wrap"
      >
        {tones.map((t) => (
          <ToggleGroupItem
            key={t.value}
            value={t.value}
            className="gap-1.5 text-xs px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
