import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Wand2, CalendarDays, Building2, UserRound, Car } from "lucide-react";
import { PageHeader, Stat } from "@/components/kit";
import { JobsList } from "@/components/JobsList";
import { actions, addDays, dubaiToday, fmtDate, useScoped, weekday, WEEKDAYS } from "@/lib/store";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/jobs")({ head: meta("Weekly Wash Planner & Cleaning Jobs", "Drill down weekday → building → cleaner → cars."), component: Jobs });

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function Jobs() {
  const { jobs, customers, staff, buildings } = useScoped();
  const [mode, setMode] = useState<"weekly" | "daily">("weekly");
  const [date, setDate] = useState(dubaiToday());
  const [cleaner, setCleaner] = useState("all");
  const [selectedDay, setSelectedDay] = useState(weekday(dubaiToday()));
  const [openBuildings, setOpenBuildings] = useState<string[]>([]);
  const [openCleaners, setOpenCleaners] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const day = jobs.filter((j) => j.date === date && (cleaner === "all" || j.cleanerId === cleaner));
  const due = customers.filter((c) => c.status === "active" && c.startDate <= date && c.weekdays.includes(weekday(date))).length;

  // Weekly recurring plan uses the selected weekdays from each active subscription.
  // A date is also shown so that future subscriptions are not counted before starting.
  const referenceWeekStart = addDays(date, -weekday(date));
  const selectedDate = addDays(referenceWeekStart, selectedDay);
  const activeForDay = customers.filter((c) => c.status === "active" && c.startDate <= selectedDate && c.weekdays.includes(selectedDay));
  const grouped = buildings.map((building) => ({
    building,
    cars: activeForDay.filter((c) => c.buildingId === building.id && (
      !search.trim() || [c.fullName, c.plate, c.parking].some((v) => v.toLowerCase().includes(search.trim().toLowerCase()))
    )),
    total: activeForDay.filter((c) => c.buildingId === building.id).length,
  })).filter((x) => x.total > 0);
  const toggle = (id: string, current: string[], set: (v: string[]) => void) => set(current.includes(id) ? current.filter((v) => v !== id) : [...current, id]);

  return (
    <>
      <PageHeader title="Weekly Wash Planner" desc="Expand a weekday, building, and cleaner to see every assigned car and parking number.">
        <Button variant={mode === "weekly" ? "default" : "outline"} onClick={() => setMode("weekly")}><CalendarDays className="h-4 w-4" /> Weekly Planner</Button>
        <Button variant={mode === "daily" ? "default" : "outline"} onClick={() => setMode("daily")}>Daily Cleaning Jobs</Button>
      </PageHeader>

      {mode === "weekly" ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
            <div><label htmlFor="week-reference" className="block text-xs text-muted-foreground">Week containing</label><input id="week-reference" type="date" className="field" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></div>
            <div><label htmlFor="wash-search" className="block text-xs text-muted-foreground">Search car, customer or parking</label><input id="wash-search" className="field" placeholder="Dubai A12345 / P2-101" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <p className="text-sm text-muted-foreground">Week: {fmtDate(referenceWeekStart)} – {fmtDate(addDays(referenceWeekStart, 6))} · Active subscriptions only</p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7" aria-label="Weekly wash days">
            {DAY_NAMES.map((name, idx) => {
              const count = customers.filter((c) => c.status === "active" && c.startDate <= addDays(referenceWeekStart, idx) && c.weekdays.includes(idx)).length;
              return <button type="button" key={name} onClick={() => { setSelectedDay(idx); setOpenBuildings([]); setOpenCleaners([]); }}
                aria-pressed={selectedDay === idx}
                className={`rounded-xl border p-3 text-left transition-colors ${selectedDay === idx ? "border-primary bg-primary/10 ring-1 ring-primary" : "bg-card hover:bg-accent"}`}>
                <div className="text-sm font-semibold">{name}</div>
                <div className="mt-1 text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">cars planned</div>
              </button>;
            })}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Cars due" value={String(activeForDay.length)} />
            <Stat label="Buildings" value={String(grouped.length)} />
            <Stat label="Assigned cleaners" value={String(new Set(activeForDay.map((c) => c.cleanerId).filter(Boolean)).size)} />
          </div>

          <div className="space-y-3">
            {grouped.map(({ building, cars, total }) => {
              const expanded = openBuildings.includes(building.id);
              const cleanerGroups = Array.from(new Set(cars.map((c) => c.cleanerId || "unassigned"))).map((id) => ({
                id, person: staff.find((s) => s.id === id), cars: cars.filter((c) => (c.cleanerId || "unassigned") === id),
              }));
              return <section key={building.id} className="overflow-hidden rounded-xl border bg-card">
                <button type="button" aria-expanded={expanded} onClick={() => toggle(building.id, openBuildings, setOpenBuildings)}
                  className="flex w-full items-center gap-3 p-4 text-left hover:bg-accent">
                  <Building2 className="h-5 w-5 text-primary" /><span className="flex-1"><span className="block font-semibold">{building.name}</span><span className="text-xs text-muted-foreground">{building.area}</span></span>
                  <span className="rounded-lg bg-secondary px-3 py-1 text-sm font-semibold">{total} cars</span>
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expanded && <div className="space-y-2 border-t p-3">
                  {cleanerGroups.length === 0 ? <p className="p-2 text-sm text-muted-foreground">No matching cars.</p> : cleanerGroups.map(({ id, person, cars: assigned }) => {
                    const key = building.id + ":" + id; const opened = openCleaners.includes(key);
                    return <div key={key} className="rounded-lg border">
                      <button type="button" aria-expanded={opened} onClick={() => toggle(key, openCleaners, setOpenCleaners)} className="flex w-full items-center gap-3 p-3 text-left hover:bg-accent">
                        <UserRound className="h-4 w-4 text-primary" />
                        <span className="flex-1"><span className="block text-sm font-semibold">{person?.name ?? "Unassigned cleaner"} {person && <span className="font-normal text-muted-foreground">· {person.id}</span>}</span><span className="text-xs text-muted-foreground">Cleaner number: {person?.phone ?? "Not assigned"}</span></span>
                        <span className="text-sm font-semibold">{assigned.length} cars</span>{opened ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {opened && <div className="divide-y border-t">
                        {assigned.map((c, index) => {
                          const job = jobs.find((j) => j.customerId === c.id && j.date === selectedDate);
                          return <div key={c.id} className="flex items-start gap-3 p-3 text-sm">
                            <Car className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <span className="flex-1"><span className="block font-semibold">{index + 1}. {c.plate}</span><span className="block text-muted-foreground">{c.fullName} · Parking {c.parking}</span></span>
                            <span className="rounded-md bg-secondary px-2 py-1 text-xs">{job?.status ?? "Planned"}</span>
                          </div>;
                        })}
                      </div>}
                    </div>;
                  })}
                </div>}
              </section>;
            })}
            {grouped.length === 0 && <p className="rounded-xl border bg-card p-6 text-center text-muted-foreground">No washes scheduled for this weekday{search ? " matching your search" : ""}.</p>}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Weekly counts come from active customer plans and selected wash weekdays. To record actual completed washes, switch to Daily Cleaning Jobs and generate that date's jobs.</p>
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button size="icon" variant="outline" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}><ChevronLeft className="h-4 w-4" /></Button>
            <input type="date" aria-label="Select date" className="field w-auto" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
            <Button size="icon" variant="outline" aria-label="Next day" onClick={() => setDate(addDays(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="ghost" onClick={() => setDate(dubaiToday())}>Today</Button>
            <select aria-label="Filter by cleaner" className="field w-auto" value={cleaner} onChange={(e) => setCleaner(e.target.value)}>
              <option value="all">All cleaners</option>{staff.filter((s) => s.role === "cleaner").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Button onClick={() => { const n = actions.generateJobs(date); n ? toast.success(`Generated ${n} new job(s)`) : toast.info("Already up to date — no duplicates created."); }}><Wand2 className="h-4 w-4" /> Generate jobs</Button>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">{WEEKDAYS[weekday(date)]}, {fmtDate(date)} · {due} active subscriptions due</p>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <Stat label="Scheduled" value={String(day.filter((j) => j.status === "scheduled").length)} />
            <Stat label="Done" value={String(day.filter((j) => j.status === "done").length)} />
            <Stat label="Skipped" value={String(day.filter((j) => j.status === "skipped").length)} />
          </div>
          <JobsList jobs={day} />
        </>
      )}
    </>
  );
}
