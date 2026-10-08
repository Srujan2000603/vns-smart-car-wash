import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, Pill } from "@/components/kit";
import { PayOptions } from "@/components/PayOptions";
import { aed, fmtDate, invoiceState, useScoped, WEEKDAYS } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/customer-view")({ head: meta("Customer View", "What a subscriber sees."), component: CV });

function CV() {
  const { customers, invoices } = useScoped();
  const [id, setId] = useState("");
  const c = customers.find((x) => x.id === id) ?? customers[0];
  if (!c) return <p>No customers.</p>;
  const inv = invoices.filter((i) => i.customerId === c.id).reverse();
  return (
    <>
      <PageHeader title="Customer view" desc="Preview as a customer">
        <select aria-label="Choose customer" className="field w-auto" value={c.id} onChange={(e) => setId(e.target.value)}>{customers.map((x) => <option key={x.id} value={x.id}>{x.fullName}</option>)}</select>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="My package">
          <p className="font-display text-2xl font-bold">{aed(c.price)}<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
          <p className="mt-2 text-sm">{c.plate} · Bay {c.parking}</p>
          <p className="text-sm">Cleaning days: {c.weekdays.map((d) => WEEKDAYS[d]).join(", ")} ({c.frequency}×/week)</p>
          <p className="text-sm">Next due: {fmtDate(c.nextDueDate)}</p>
        </Panel>
        <Panel title="My invoices">
          <ul className="space-y-3">{inv.map((i) => <li key={i.id} className="rounded-lg border p-3"><div className="mb-2 flex justify-between text-sm"><span>{i.number} · {aed(i.amount)}</span><Pill v={invoiceState(i)} /></div><PayOptions inv={i} /></li>)}</ul>
        </Panel>
      </div>
    </>
  );
}