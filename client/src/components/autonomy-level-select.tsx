import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const AUTONOMY_LEVELS = [
  {
    value: 0,
    label: "L0 — Advisor",
    description: "Read-only, drafts only. Human must approve everything."
  },
  {
    value: 1,
    label: "L1 — Operator",
    description: "Can transform/draft/export; cannot post decisions or spend budget without sign-off."
  },
  {
    value: 2,
    label: "L2 — Executor",
    description: "Can run scoped workflows end-to-end (e.g., export packs, create checklists) within caps; posts Mirror-Backs automatically."
  },
  {
    value: 3,
    label: "L3 — Orchestrator",
    description: "Can spawn/coordinate other agents; high scrutiny; typically reserved for OS/Helm-class agents."
  }
];

interface AutonomyLevelSelectProps {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
}

export function AutonomyLevelSelect({ value, onValueChange, disabled }: AutonomyLevelSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="autonomy-level">Autonomy Level</Label>
      <Select 
        value={value.toString()} 
        onValueChange={(val) => onValueChange(parseInt(val))}
        disabled={disabled}
      >
        <SelectTrigger id="autonomy-level" data-testid="select-autonomy-level">
          <SelectValue placeholder="Select autonomy level..." />
        </SelectTrigger>
        <SelectContent>
          {AUTONOMY_LEVELS.map((level) => (
            <SelectItem 
              key={level.value} 
              value={level.value.toString()}
              data-testid={`option-autonomy-${level.value}`}
            >
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm">{level.label}</span>
                <span className="text-xs text-muted-foreground">{level.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {AUTONOMY_LEVELS.find(l => l.value === value)?.description}
      </p>
    </div>
  );
}

export { AUTONOMY_LEVELS };
