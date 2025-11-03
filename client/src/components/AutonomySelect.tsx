type AutonomyLevel = "L0" | "L1" | "L2" | "L3";

const OPTIONS: { value: AutonomyLevel; label: string; desc: string }[] = [
  {
    value: "L0",
    label: "L0 — Advisor",
    desc: "Read-only, drafts only. Human must approve everything."
  },
  {
    value: "L1",
    label: "L1 — Operator",
    desc: "Can transform/draft/export; cannot post decisions or spend budget without sign-off."
  },
  {
    value: "L2",
    label: "L2 — Executor",
    desc: "Runs scoped workflows end-to-end within caps; posts Mirror-Backs automatically."
  },
  {
    value: "L3",
    label: "L3 — Orchestrator",
    desc: "Can spawn/coordinate other agents; high scrutiny (OS/Helm-class)."
  }
];

export function AutonomySelect({
  value,
  onChange,
  name = "autonomy_level",
  label = "Autonomy level",
  helpId = "autonomy-help"
}: {
  value: AutonomyLevel | "";
  onChange: (v: AutonomyLevel) => void;
  name?: string;
  label?: string;
  helpId?: string;
}) {
  return (
    <div className="grid gap-2">
      <label
        htmlFor={name}
        className="font-grotesk text-sm text-text-primary"
      >
        {label}
      </label>

      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value as AutonomyLevel)}
          aria-describedby={helpId}
          data-testid={`select-${name}`}
          className="
            w-full rounded-xl px-3 py-2
            bg-background text-foreground
            border border-border
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand
          "
        >
          <option value="" disabled>
            Select autonomy level…
          </option>
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Optional chevron */}
        <div className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-muted-foreground">
          ▾
        </div>
      </div>

      {/* Inline help that updates with selection */}
      <p id={helpId} className="text-sm text-muted-foreground">
        {(OPTIONS.find((o) => o.value === value)?.desc ??
          "Choose the highest autonomy you're comfortable granting this agent.")}
      </p>
    </div>
  );
}
