import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Field, Modal, PageHeader, Pill, Table, td } from "@/components/kit";
import { actions, aed, dubaiToday, addMonths, fmtDate, useScoped, WEEKDAYS, type Customer } from "@/lib/store";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customers")({ head: meta("Customers", "Subscription customers, vehicles and wash schedules."), component: Customers });

type Form = Omit<Customer, "companyId" | "id"> & { id?: string };

function Customers() {
  const { customers, buildings, staff } = useScoped();
  const [form, setForm] = useState<Form | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [q, setQ] = useState(""); const [st, setSt] = useState("all"); const [bld, setBld] = useState("all");
  const cleaners = staff.filter((s) => s.role === "cleaner"); const sups = staff.filter((s) => s.role === "supervisor");
  const list = customers.filter((c) => (st === "all" || c.status === st) && (bld === "all" || c.buildingId === bld) &&
    (c.fullName + c.plate + c.parking + c.contact).toLowerCase().includes(q.toLowerCase()));

  const openNew = () => {
    const t = dubaiToday();
    setErrs({});
    setForm({ fullName: "", contact: "", buildingId: buildings[0]?.id ?? "", parking: "", plate: "", frequency: 2, weekdays: [], price: 250, startDate: t, nextDueDate: addMonths(t, 0), cleanerId: cleaners[0]?.id ?? "", supervisorId: sups[0]?.id ?? "", status: "active", notes: "" });
  };
  const save = () => {
    if (!form) return;
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.contact.trim()) e.contact = "Required";
    if (!form.plate.trim()) e.plate = "Required";
    if (!form.parking.trim()) e.parking = "Required";
    if (!form.buildingId) e.buildingId = "Add a building first";
    if (!form.cleanerId) e.cleanerId = "Add a cleaner first";
    if (!form.supervisorId) e.supervisorId = "Add a supervisor first";
    if (form.frequency < 1 || form.frequency > 7) e.frequency = "1 to 7";
    if (form.weekdays.length !== form.frequency) e.weekdays = `Select exactly ${form.frequency} day(s) — currently ${form.weekdays.length}.`;
    if (!(form.price > 0)) e.price = "Must be more than 0";
    if (!form.startDate) e.startDate = "Required";
    if (!form.nextDueDate) e.nextDueDate = "Required";
    else if (form.nextDueDate < form.startDate) e.nextDueDate = "Cannot be before start date";
    setErrs(e);
    if (Object.keys(e).length) return;
    actions.upsert("customers", { ...form, weekdays: [...form.weekdays].sort() });
    toast.success(form.id ? "Customer updated" : "Customer added"); setForm(null);
  };
  const toggleDay = (d: number) => form && setForm({ ...form, weekdays: form.weekdays.includes(d) ? form.weekdays.filter((x) => x !== d) : [...form.weekdays, d] });
  const name = (id: string) => staff.find((s) => s.id === id)?.name ?? "—";

  return (
    <>
      <PageHeader title="Customers" desc={`${customers.length} subscriptions in this company`}>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add customer</Button>
      </PageHeader>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <input aria-label="Search customers" className="field" placeholder="Search name, plate, parking…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Filter by status" className="field" value={st} onChange={(e) => setSt(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option></select>
        <select aria-label="Filter by building" className="field" value={bld} onChange={(e) => setBld(e.target.value)}><option value="all">All buildings</option>{buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
      </div>
      <Table head={["Customer", "Vehicle / Parking", "Schedule", "Price", "Next due", "Staff", "Status", ""]} empty={!list.length}>
        {list.map((c) => (
          <tr key={c.id}>
            <td className={td}><p className="font-medium">{c.fullName}</p><p className="text-xs text-muted-foreground">{c.contact}</p></td>
            <td className={td}><p className="font-mono text-xs font-semibold">{c.plate}</p><p className="text-xs text-muted-foreground">{buildings.find((b) => b.id === c.buildingId)?.name} · {c.parking}</p></td>
            <td className={td}><p>{c.frequency}×/week</p><p className="text-xs text-muted-foreground">{c.weekdays.map((d) => WEEKDAYS[d]).join(", ")}</p></td>
            <td className={td}>{aed(c.price)}</td>
            <td className={td}>{fmtDate(c.nextDueDate)}</td>
            <td className={td + " text-xs"}><p>{name(c.cleanerId)}</p><p className="text-muted-foreground">Sup: {name(c.supervisorId)}</p></td>
            <td className={td}><Pill v={c.status} /></td>
            <td className={td + " whitespace-nowrap text-right"}>
              <Button size="icon" variant="ghost" aria-label={`Edit ${c.fullName}`} onClick={() => { setErrs({}); setForm(c); }}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={`Delete ${c.fullName}`} onClick={() => { if (confirm(`Delete ${c.fullName}? Their invoices and job history remain.`)) { actions.remove("customers", c.id); toast.success("Customer deleted"); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Edit customer" : "Add customer"} desc="Weekdays selected must equal the weekly frequency.">
        {form && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" error={errs.fullName}><input className="field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
            <Field label="Contact (phone / email)" error={errs.contact}><input className="field" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
            <Field label="Building" error={errs.buildingId}><select className="field" value={form.buildingId} onChange={(e) => setForm({ ...form, buildingId: e.target.value })}>{buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
            <Field label="Parking number" error={errs.parking}><input className="field" value={form.parking} onChange={(e) => setForm({ ...form, parking: e.target.value })} placeholder="P2-114" /></Field>
            <Field label="Vehicle plate" error={errs.plate}><input className="field" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} placeholder="DXB A 12345" /></Field>
            <Field label="Weekly cleaning frequency (1–7)" error={errs.frequency}>
              <select className="field" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: +e.target.value })}>{[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}× per week</option>)}</select>
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-1 text-sm font-medium">Cleaning weekdays <span className="text-muted-foreground">({form.weekdays.length}/{form.frequency} selected)</span></p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Cleaning weekdays">
                {WEEKDAYS.map((d, i) => (
                  <button key={d} type="button" aria-pressed={form.weekdays.includes(i)} onClick={() => toggleDay(i)}
                    className={cn("min-w-12 rounded-md border px-3 py-2 text-sm font-medium", form.weekdays.includes(i) ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>{d}</button>
                ))}
              </div>
              {errs.weekdays && <p role="alert" className="mt-1 text-xs text-destructive">{errs.weekdays}</p>}
            </div>
            <Field label="Monthly subscription (AED)" error={errs.price}><input type="number" min={1} className="field" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></Field>
            <Field label="Status"><select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Customer["status"] })}><option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option></select></Field>
            <Field label="Start date" error={errs.startDate}><input type="date" className="field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
            <Field label="Next due date" error={errs.nextDueDate}><input type="date" className="field" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} /></Field>
            <Field label="Cleaner" error={errs.cleanerId}><select className="field" value={form.cleanerId} onChange={(e) => setForm({ ...form, cleanerId: e.target.value })}>{cleaners.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
            <Field label="Assigned supervisor" error={errs.supervisorId}><select className="field" value={form.supervisorId} onChange={(e) => setForm({ ...form, supervisorId: e.target.value })}>{sups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
            <div className="sm:col-span-2"><Field label="Notes"><textarea className="field" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
            <div className="flex justify-end gap-2 sm:col-span-2"><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save}>Save customer</Button></div>
          </div>
        )}
      </Modal>
    </>
  );
}