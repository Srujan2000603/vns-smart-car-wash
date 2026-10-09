import { AlertTriangle, Info } from "lucide-react";
import { CAPACITY, WEEKDAYS, type Staff } from "@/lib/store";
import type { useWeekPlan } from "@/lib/ops";

export function CapacityPanel({ plan, staff }: { plan: ReturnType<typeof useWeekPlan>; staff: Staff[] }) {
  const name = (id: string) => staff.find((s) => s.id === id)?.name ?? id;
  const over = plan.weeklyDemand > plan.capMax;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Box label="Active cars" v={plan.activeCars.toLocaleString()} />
        <Box label="Washes / week (2× each)" v={plan.weeklyDemand.toLocaleString()} />
        <Box label="Active cleaners × 6 days" v={`${plan.cleaners.length} × 6`} />
        <Box label={`Capacity @ ${CAPACITY.min}–${CAPACITY.max}/day`} v={`${plan.capMin.toLocaleString()}–${plan.capMax.toLocaleString()}`} />
      </div>
      {(over || plan.overloads.length > 0) && (
        <div role="alert" className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Schedule NOT feasible within the {CAPACITY.min}–{CAPACITY.max} cars/day preference.</p>
            {over && <p>Weekly demand {plan.weeklyDemand} exceeds max capacity {plan.capMax}.</p>}
            {plan.overloads.length > 0 && <p>{plan.overloads.length} cleaner-day(s) above {CAPACITY.max} cars, e.g. {plan.overloads.slice(0, 4).map((o) => `${name(o.id)} ${WEEKDAYS[o.day]} (${o.n})`).join(", ")}. Add cleaners or rebalance customer wash days.</p>}
          </div>
        </div>
      )}
      {plan.underloads.length > 0 && (
        <div className="flex gap-3 rounded-lg border border-warning/50 bg-warning/15 p-3 text-sm text-warning-foreground">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{plan.underloads.length} cleaner-day(s) below {CAPACITY.min} cars (under-utilised) — demand is uneven across weekdays.</p>
        </div>
      )}
    </div>
  );
}
function Box({ label, v }: { label: string; v: string }) {
  return <div className="rounded-lg border bg-card p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="font-display text-lg font-bold">{v}</p></div>;
}