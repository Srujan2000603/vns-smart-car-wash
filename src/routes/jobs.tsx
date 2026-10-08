import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Wand2 } from "lucide-react";
import { PageHeader, Stat } from "@/components/kit";
import { JobsList } from "@/components/JobsList";
import { actions, addDays, dubaiToday, fmtDate, useScoped, weekday, WEEKDAYS } from "@/lib/store";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/jobs")({ head: meta("Cleaning Jobs", "Daily wash jobs generated from subscription weekdays."), component: Jobs });

function Jobs() {
  const { jobs, customers } = useScoped();
  const [date, setDate] = useState(dubaiToday());
  const [cleaner, setCleaner] = useState("all");
  const { staff } = useScoped();
  const day = jobs.filter((j) => j.date === date && (cleaner === "all" || j.cleanerId === cleaner));
  const due = customers.filter((c) => c.status === "active" && c.startDate <= date && c.weekdays.includes(weekday(date))).length;
  return (
    <>
      <PageHeader title="Cleaning Jobs" desc={`${WEEKDAYS[weekday(date)]}, ${fmtDate(date)} · ${due} active subscription(s) due this day`}>
        <Button onClick={() => { const n = actions.generateJobs(date); n ? toast.success(`Generated ${n} new job(s)`) : toast.info("Already up to date — no duplicates created."); }}><Wand2 className="h-4 w-4" /> Generate jobs</Button>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="icon" variant="outline" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}><ChevronLeft className="h-4 w-4" /></Button>
        <input type="date" aria-label="Select date" className="field w-auto" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <Button size="icon" variant="outline" aria-label="Next day" onClick={() => setDate(addDays(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="ghost" onClick={() => setDate(dubaiToday())}>Today</Button>
        <select aria-label="Filter by cleaner" className="field w-auto" value={cleaner} onChange={(e) => setCleaner(e.target.value)}>
          <option value="all">All cleaners</option>{staff.filter((s) => s.role === "cleaner").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Scheduled" value={String(day.filter((j) => j.status === "scheduled").length)} />
        <Stat label="Done" value={String(day.filter((j) => j.status === "done").length)} />
        <Stat label="Skipped" value={String(day.filter((j) => j.status === "skipped").length)} />
      </div>
      <JobsList jobs={day} />
    </>
  );
}