import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarClock, Phone } from "lucide-react";
import { Field, Modal, PageHeader } from "@/components/kit";
import { actions, addDays, addMonths, aed, dubaiToday, effectiveDue, fmtDate, fmtDateTime, telHref, useScoped, type Invoice } from "@/lib/store";
import { dueBlock, type DueBlock } from "@/lib/ops";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dues")({ head: meta("Dues & Overdue", "Due today, extended today, overdue and upcoming invoices with extension workflow."), component: Dues });

const BLOCKS: { k: DueBlock; label: string; tone: string }[] = [
  { k: "due-today", label: "DUE TODAY", tone: "border-warning bg-warning/15" },
  { k: "extended-today", label: "EXTENDED TODAY", tone: "border-primary bg-accent" },
  { k: "overdue", label: "OVERDUE", tone: "border-destructive bg-destructive/10" },
  { k: "upcoming", label: "UPCOMING (7 days)", tone: "border-border bg-card" },
];

function Dues() {
  const { invoices, customers, buildings } = useScoped();
  const [sel, setSel] = useState<DueBlock>("overdue");
  const [q, setQ] = useState("");
  const [ext, setExt] = useState<Invoice | null>(null);
  const [to, setTo] = useState(""); const [reason, setReason] = useState(""); const [moveMonthly, setMoveMonthly] = useState(false);
  const cust = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const bName = (id: string) => buildings.find((b) => b.id === id)?.name ?? "—";
  const byBlock = useMemo(() => {
    const m = new Map<DueBlock, Invoice[]>(BLOCKS.map((b) => [b.k, []]));
    for (const i of invoices) { const b = dueBlock(i); if (b) m.get(b)!.push(i); }
    return m;
  }, [invoices]);
  const list = (byBlock.get(sel) ?? []).filter((i) => { const c = cust.get(i.customerId); return !q || (c && (c.fullName + c.plate + c.contact).toLowerCase().includes(q.toLowerCase())); });
  const groups = new Map<string, Invoice[]>();
  [...list].sort((a, b) => { const ca = cust.get(a.customerId), cb = cust.get(b.customerId);
    return bName(ca?.buildingId ?? "").localeCompare(bName(cb?.buildingId ?? "")) || (ca?.fullName ?? "").localeCompare(cb?.fullName ?? ""); })
    .forEach((i) => { const k = cust.get(i.customerId)?.buildingId ?? "?"; groups.set(k, [...(groups.get(k) ?? []), i]); });

  const openExt = (i: Invoice) => { setExt(i); setTo(addDays(dubaiToday(), 3)); setReason(""); setMoveMonthly(false); };
  const submit = () => {
    if (!ext) return;
    const err = actions.extendDue(ext.id, to, reason);
    if (err) { toast.error(err); return; }
    if (moveMonthly) actions.rescheduleCustomerDue(ext.customerId, addMonths(to, 1), reason);
    toast.success("Due date extended — invoice remains unpaid"); setExt(null);
  };

  return (
    <>
      <PageHeader title="Dues & overdue" desc={`Today ${fmtDate(dubaiToday())} (Dubai). Extending a due date never marks an invoice paid.`}>
        <Button asChild variant="outline"><Link to="/invoices">All invoices</Link></Button>
      </PageHeader>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {BLOCKS.map((b) => { const arr = byBlock.get(b.k) ?? []; return (
          <button key={b.k} onClick={() => setSel(b.k)} aria-pressed={sel === b.k}
            className={cn("rounded-xl border-2 p-4 text-left transition", b.tone, sel === b.k ? "ring-2 ring-ring" : "opacity-90 hover:opacity-100")}>
            <p className="text-xs font-bold tracking-wide">{b.label}</p>
            <p className="font-display text-2xl font-bold">{arr.length}</p>
            <p className="text-sm">{aed(arr.reduce((a, i) => a + i.amount, 0))}</p>
          </button>); })}
      </div>
      <input aria-label="Search dues" className="field mb-4 max-w-md" placeholder="Search customer, plate or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      {groups.size === 0 && <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nothing in this block.</p>}
      <div className="space-y-6">
        {[...groups].map(([bid, arr]) => (
          <section key={bid}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">{bName(bid)} · {arr.length}</h2>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {arr.map((i) => { const c = cust.get(i.customerId); return (
                <li key={i.id} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="font-semibold">{c?.fullName ?? "Deleted customer"}</p>
                      {c && <a href={telHref(c.contact)} className="inline-flex items-center gap-1 text-sm font-medium text-primary"><Phone className="h-3.5 w-3.5" />{c.contact}</a>}</div>
                    <p className="font-display text-lg font-bold">{aed(i.amount)}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{c?.plate} · <span className="uppercase">{c?.vehicleClass}</span> · Bay {c?.parking} · {i.number}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-1 text-xs">
                    <dt className="text-muted-foreground">Original due</dt><dd className="font-medium">{fmtDate(i.dueDate)}</dd>
                    <dt className="text-muted-foreground">Extended to</dt><dd className="font-medium">{i.extendedDueDate ? fmtDate(i.extendedDueDate) : "—"}</dd>
                    <dt className="text-muted-foreground">Period</dt><dd>{fmtDate(i.period)} – {fmtDate(i.periodEnd)}</dd>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openExt(i)}><CalendarClock className="h-4 w-4" /> Extend / reschedule</Button>
                    <Button size="sm" asChild><Link to="/invoices/$id" params={{ id: i.id }}>Payment options</Link></Button>
                  </div>
                </li>); })}
            </ul>
          </section>
        ))}
      </div>

      <Modal open={!!ext} onClose={() => setExt(null)} title={`Extend due date · ${ext?.number ?? ""}`} desc="The original due date is kept. The invoice stays unpaid.">
        {ext && (
          <div className="space-y-3">
            <p className="text-sm">Original: <b>{fmtDate(ext.dueDate)}</b> · Current effective: <b>{fmtDate(effectiveDue(ext))}</b></p>
            <Field label="New extended due date"><input type="date" className="field" min={dubaiToday()} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
            <Field label="Reason (required, saved to audit)"><textarea className="field" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer on leave until salary date" /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={moveMonthly} onChange={(e) => setMoveMonthly(e.target.checked)} /> Also move this customer’s future monthly due date to the same day of month</label>
            {ext.extensions.length > 0 && (
              <div><p className="text-sm font-semibold">Extension history</p>
                <ul className="mt-1 space-y-1 text-xs">{ext.extensions.map((x, k) => <li key={k}>{fmtDateTime(x.at)}: {fmtDate(x.from)} → {fmtDate(x.to)} — {x.reason}</li>)}</ul></div>)}
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setExt(null)}>Cancel</Button><Button onClick={submit} disabled={!reason.trim() || !to}>Save extension</Button></div>
          </div>
        )}
      </Modal>
    </>
  );
}