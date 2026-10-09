import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Phone } from "lucide-react";
import { PageHeader, Panel, Pill } from "@/components/kit";
import { CapacityPanel } from "@/components/CapacityPanel";
import { CAPACITY, WEEKDAYS, WORK_DAYS, dubaiToday, telHref, useScoped, weekday } from "@/lib/store";
import { useWeekPlan } from "@/lib/ops";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planner")({ head: meta("Weekly Planner", "Balanced building and cleaner routes for each workday. Monday off."), component: Planner });

function Planner() {
  const { customers, buildings, staff } = useScoped();
  const plan = useWeekPlan(customers, buildings, staff);
  const td = weekday(dubaiToday());
  const [day, setDay] = useState(td === 1 ? 0 : td);
  const [bld, setBld] = useState<string | null>(null);
  const [cl, setCl] = useState<string | null>(null);
  const d = plan.days.find((x) => x.day === day)!;
  const cleanerOf = new Map<string, string>(); for (const [id, l] of d.out) for (const c of l) cleanerOf.set(c.id, id);
  const name = (id: string) => staff.find((s) => s.id === id)?.name ?? "—";
  const bName = (id: string) => buildings.find((b) => b.id === id)?.name ?? "—";
  const bCars = (id: string) => d.due.filter((c) => c.buildingId === id);
  const selCars = bld ? bCars(bld) : [];
  const bCleaners = [...new Set(selCars.map((c) => cleanerOf.get(c.id)!))];
  const route = cl ? d.out.get(cl) ?? [] : [];

  return (
    <>
      <PageHeader title="Weekly Planner" desc="Routes auto-balanced daily across active cleaners, ordered by building then parking bay." />
      <CapacityPanel plan={plan} staff={staff} />
      <div className="my-5 flex flex-wrap gap-2" role="tablist" aria-label="Weekday">
        {WEEKDAYS.map((w, i) => i === 1 ? (
          <span key={w} className="rounded-md border border-dashed px-4 py-2 text-sm text-muted-foreground line-through" title="Monday off — no washes">Mon OFF</span>
        ) : (
          <button key={w} role="tab" aria-selected={day === i} onClick={() => { setDay(i); setCl(null); }}
            className={cn("rounded-md border px-4 py-2 text-sm font-semibold", day === i ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
            {w} <span className="ml-1 text-xs opacity-80">{plan.days.find((x) => x.day === i)?.due.length}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panel title={`Buildings · ${WEEKDAYS[day]} (${d.due.length} cars)`}>
          <ul className="grid max-h-[560px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {buildings.map((b) => { const n = bCars(b.id).length; return (
              <li key={b.id}><button onClick={() => { setBld(b.id); setCl(null); }} aria-pressed={bld === b.id}
                className={cn("w-full rounded-lg border p-3 text-left text-sm", bld === b.id ? "border-primary bg-accent" : "bg-card hover:bg-muted")}>
                <p className="font-semibold">{b.name}</p><p className="text-xs text-muted-foreground">{b.area} · {n} car(s) due</p>
              </button></li>); })}
          </ul>
        </Panel>
        <Panel title={bld ? `${bName(bld)} — cleaners` : "Select a building"}>
          {!bld ? <p className="text-sm text-muted-foreground">Click a building to see which cleaners serve it on {WEEKDAYS[day]}.</p> : (
            <>
              {selCars.length === 0 && <p className="text-sm text-muted-foreground">No cars due here on {WEEKDAYS[day]}.</p>}
              <div className="flex flex-wrap gap-2">
                {bCleaners.map((id) => { const total = d.out.get(id)?.length ?? 0; const here = selCars.filter((c) => cleanerOf.get(c.id) === id).length; return (
                  <button key={id} onClick={() => setCl(cl === id ? null : id)} aria-expanded={cl === id}
                    className={cn("rounded-lg border px-3 py-2 text-left text-sm", cl === id ? "border-primary bg-accent" : "bg-card hover:bg-muted")}>
                    <span className="font-semibold">{name(id)}</span>
                    <span className="block text-xs text-muted-foreground">{here} here · {total} total today</span>
                    {total > CAPACITY.max && <span className="mt-1 inline-block rounded bg-destructive/15 px-1.5 text-xs font-semibold text-destructive">OVERLOAD &gt;{CAPACITY.max}</span>}
                    {total < CAPACITY.min && <span className="mt-1 inline-block rounded bg-warning/25 px-1.5 text-xs font-semibold text-warning-foreground">Under {CAPACITY.min}</span>}
                  </button>); })}
              </div>
              {cl && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold">{name(cl)} · full {WEEKDAYS[day]} route ({route.length})</h3>
                    <Link to="/roster" search={{ cleaner: cl }} className="text-sm font-medium text-primary">Open roster →</Link></div>
                  <ol className="max-h-[480px] divide-y overflow-y-auto rounded-lg border text-sm">
                    {route.map((c, i) => (
                      <li key={c.id} className={cn("grid grid-cols-[2rem_1fr_auto] items-center gap-2 px-3 py-2", c.buildingId === bld && "bg-accent/50")}>
                        <span className="text-xs text-muted-foreground">{i + 1}</span>
                        <span><span className="font-medium">{c.fullName}</span> · <span className="font-mono text-xs">{c.plate}</span> · <span className="uppercase text-xs">{c.vehicleClass}</span>
                          <span className="block text-xs text-muted-foreground">{bName(c.buildingId)} · Bay {c.parking} · <a href={telHref(c.contact)} className="text-primary"><Phone className="inline h-3 w-3" /> {c.contact}</a></span></span>
                        <Pill v={c.status} />
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </Panel>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Allowed workdays: {WORK_DAYS.map((x) => WEEKDAYS[x]).join(", ")}. Monday has no jobs.</p>
    </>
  );
}