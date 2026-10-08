import { useState } from "react";
import { Check, SkipForward, Undo2 } from "lucide-react";
import { Field, Modal, Pill } from "@/components/kit";
import { actions, fmtDateTime, useScoped, type Job } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function JobsList({ jobs }: { jobs: Job[] }) {
  const { customers, buildings, staff } = useScoped();
  const [skip, setSkip] = useState<Job | null>(null);
  const [reason, setReason] = useState("");
  if (!jobs.length) return <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No jobs for this day. Use “Generate jobs” to create today’s due washes.</p>;
  return (
    <>
      <ul className="grid gap-3 md:grid-cols-2">
        {jobs.map((j) => {
          const c = customers.find((x) => x.id === j.customerId);
          return (
            <li key={j.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-bold">{c?.plate ?? "Deleted customer"}</p>
                  <p className="text-sm">{c?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{buildings.find((b) => b.id === c?.buildingId)?.name} · Bay {c?.parking} · Cleaner {staff.find((s) => s.id === j.cleanerId)?.name}</p>
                </div>
                <Pill v={j.status} />
              </div>
              {j.status !== "scheduled" && <p className="mt-2 text-xs text-muted-foreground">{j.status === "done" ? "Completed" : "Skipped"} {fmtDateTime(j.at)}{j.reason ? ` — ${j.reason}` : ""}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {j.status === "scheduled" ? (
                  <>
                    <Button size="sm" onClick={() => { actions.setJob(j.id, "done"); toast.success("Marked done"); }}><Check className="h-4 w-4" /> Mark done</Button>
                    <Button size="sm" variant="outline" onClick={() => { setReason(""); setSkip(j); }}><SkipForward className="h-4 w-4" /> Skip</Button>
                  </>
                ) : <Button size="sm" variant="ghost" onClick={() => actions.setJob(j.id, "scheduled")}><Undo2 className="h-4 w-4" /> Undo</Button>}
              </div>
            </li>
          );
        })}
      </ul>
      <Modal open={!!skip} onClose={() => setSkip(null)} title="Skip job" desc="A reason is required and saved with a timestamp.">
        <Field label="Reason">
          <select className="field" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Choose a reason…</option>
            <option>Car not in parking bay</option><option>Customer requested skip</option><option>Water supply issue</option><option>Bay blocked / access denied</option><option>Weather (sandstorm/rain)</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setSkip(null)}>Cancel</Button>
          <Button disabled={!reason} onClick={() => { actions.setJob(skip!.id, "skipped", reason); toast.success("Job skipped"); setSkip(null); }}>Confirm skip</Button></div>
      </Modal>
    </>
  );
}