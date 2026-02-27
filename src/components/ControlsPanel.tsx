import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MessageSquare, Briefcase, GraduationCap, Heart } from "lucide-react";

interface ControlsPanelProps {
  tone: string;
  onToneChange: (tone: string) => void;
  level: string;
  onLevelChange: (level: string) => void;
}

const tones = [
  { value: "casual", label: "Casual", icon: MessageSquare },
  { value: "professional", label: "Professional", icon: Briefcase },
  { value: "academic", label: "Academic", icon: GraduationCap },
  { value: "friendly", label: "Friendly", icon: Heart },
];

const levels = ["mild", "medium", "strong"];

export function ControlsPanel({ tone, onToneChange, level, onLevelChange }: ControlsPanelProps) {
  const levelIndex = levels.indexOf(level);

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
      <div className="space-y-2">
        <Label className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
          Tone
        </Label>
        <ToggleGroup
          type="single"
          value={tone}
          onValueChange={(v) => v && onToneChange(v)}
          className="gap-1"
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

      <div className="space-y-2 min-w-[200px]">
        <Label className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
          Humanization: <span className="capitalize text-foreground">{level}</span>
        </Label>
        <Slider
          value={[levelIndex]}
          onValueChange={([v]) => onLevelChange(levels[v])}
          min={0}
          max={2}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );
}
