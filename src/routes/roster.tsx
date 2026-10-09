import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { PageHeader, Pill, Table, td } from "@/components/kit";
import { CAPACITY, WEEKDAYS, invoiceState, telHref, useScoped } from "@/lib/store";
import { useWeekPlan } from "@/lib/ops";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/roster")({
  head: meta("Cleaner Roster", "Searchable weekly roster per cleaner with export and print."),
  validateSearch: (s: Record<string, unknown>): { cleaner?: string | undefined } => ({ cleaner: typeof s["cleaner"] === "string" ? s["cleaner"] : undefined }),
  component: Roster,
});

function Roster() {
  const { customers, buildings, staff, invoices } = useScoped();
  const plan = useWeekPlan(customers, buildings, staff);
  const search = Route.useSearch();
  const cleaners = staff.filter((s) => s.role === "cleaner");
  const [cl, setCl] = useState(search.cleaner && cleaners.some((c) => c.id === search.cleaner) ? search.cleaner : cleaners[0]?.id ?? "");
  const [day, setDay] = useState("all"); const [bld, setBld] = useState("all"); const [q, setQ] = useState("");
  const overdue = new Set(invoices.filter((i) => invoiceState(i) === "overdue").map((i) => i.customerId));
  const bName = (id: string) => buildings.find((b) => b.id === id)?.name ?? "—";
  const rows = plan.days.flatMap((d) => (d.out.get(cl) ?? []).map((c, i) => ({ day: d.day, order: i + 1, c })))
    .filter((r) => (day === "all" || r.day === +day) && (bld === "all" || r.c.buildingId === bld) &&
      (r.c.fullName + r.c.plate + r.c.parking + r.c.contact).toLowerCase().includes(q.toLowerCase()));
  const me = staff.find((s) => s.id === cl);

  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [["Day", "Order", "Building", "Parking", "Customer", "Plate", "Class", "Phone", "Status"].join(",")]
      .concat(rows.map((r) => [WEEKDAYS[r.day] ?? "", r.order, bName(r.c.buildingId), r.c.parking, r.c.fullName, r.c.plate, r.c.vehicleClass, r.c.contact, r.c.status].map(esc).join(",")));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `roster-${me?.name.replace(/\s+/g, "-") ?? "cleaner"}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="Cleaner roster" desc={me ? `${me.name} · ${me.phone} · ${rows.length} wash(es) shown` : "No cleaners"}>
        <Button variant="outline" onClick={exportCsv} disabled={!rows.length}><Download className="h-4 w-4" /> Export CSV</Button>
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
      </PageHeader>
      <div className="mb-3 grid gap-2 sm:grid-cols-4 print:hidden">
        <select aria-label="Cleaner" className="field" value={cl} onChange={(e) => setCl(e.target.value)}>{cleaners.map((s) => <option key={s.id} value={s.id}>{s.name}{s.active ? "" : " (inactive)"}</option>)}</select>
        <select aria-label="Weekday" className="field" value={day} onChange={(e) => setDay(e.target.value)}><option value="all">All workdays</option>{plan.days.map((d) => <option key={d.day} value={d.day}>{WEEKDAYS[d.day]}</option>)}</select>
        <select aria-label="Building" className="field" value={bld} onChange={(e) => setBld(e.target.value)}><option value="all">All buildings</option>{buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        <input aria-label="Search roster" className="field" placeholder="Search name, plate, bay, phone" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {plan.days.map((d) => { const n = d.out.get(cl)?.length ?? 0; return (
          <span key={d.day} className={`rounded-full px-3 py-1 font-semibold ${n > CAPACITY.max ? "bg-destructive/15 text-destructive" : n < CAPACITY.min ? "bg-warning/25 text-warning-foreground" : "bg-success/15 text-success"}`}>{WEEKDAYS[d.day]}: {n}{n > CAPACITY.max ? " OVERLOAD" : ""}</span>); })}
        <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">Mon: OFF</span>
      </div>
      {me && !me.active && <p className="mb-3 text-sm text-destructive">This cleaner is inactive and receives no routes.</p>}
      <Table head={["Day", "#", "Building", "Parking", "Customer", "Plate", "Class", "Phone", "Status"]} empty={!rows.length}>
        {rows.slice(0, 500).map((r) => (
          <tr key={r.day + r.c.id}>
            <td className={td}>{WEEKDAYS[r.day]}</td><td className={td}>{r.order}</td><td className={td}>{bName(r.c.buildingId)}</td><td className={td}>{r.c.parking}</td>
            <td className={td + " font-medium"}>{r.c.fullName}</td><td className={td + " font-mono text-xs"}>{r.c.plate}</td><td className={td + " uppercase text-xs"}>{r.c.vehicleClass}</td>
            <td className={td}><a href={telHref(r.c.contact)} className="text-primary">{r.c.contact}</a></td>
            <td className={td}><Pill v={r.c.status} />{overdue.has(r.c.id) && <span className="ml-1"><Pill v="overdue" /></span>}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}