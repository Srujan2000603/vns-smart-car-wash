import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/kit";
import { JobsList } from "@/components/JobsList";
import { CollectionsTable } from "@/components/CollectionsTable";
import { dubaiToday, useScoped } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/staff-view")({ head: meta("Staff View", "Cleaner jobs and supervisor collections."), component: SV });

function SV() {
  const { staff, jobs, collections, invoices, customers } = useScoped();
  const [id, setId] = useState("");
  const s = staff.find((x) => x.id === id) ?? staff[0];
  if (!s) return <p>No staff.</p>;
  const mine = collections.filter((c) => customers.find((cu) => cu.id === invoices.find((i) => i.id === c.invoiceId)?.customerId)?.supervisorId === s.id);
  return (
    <>
      <PageHeader title="Staff view" desc={`${s.name} · ${s.role}`}>
        <select aria-label="Choose staff" className="field w-auto" value={s.id} onChange={(e) => setId(e.target.value)}>{staff.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.role})</option>)}</select>
      </PageHeader>
      {s.role === "cleaner" ? <JobsList jobs={jobs.filter((j) => j.cleanerId === s.id && j.date === dubaiToday())} /> : <CollectionsTable rows={mine} supervisorId={s.id} />}
    </>
  );
}