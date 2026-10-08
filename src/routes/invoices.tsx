import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Pill, Table, td } from "@/components/kit";
import { actions, aed, dubaiToday, fmtDate, invoiceState, useScoped } from "@/lib/store";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/invoices")({ head: meta("Invoices", "Monthly subscription invoices in AED."), component: Invoices });

function Invoices() {
  const m = useMatchRoute();
  const { invoices, customers } = useScoped();
  const [f, setF] = useState("all");
  if (m({ to: "/invoices/$id", fuzzy: true })) return <Outlet />;
  const list = [...invoices].reverse().filter((i) => f === "all" || invoiceState(i) === f);
  return (
    <>
      <PageHeader title="Invoices" desc="Generated from each customer's next due date. Repeat generation never duplicates.">
        <select aria-label="Filter invoices" className="field w-auto" value={f} onChange={(e) => setF(e.target.value)}>
          <option value="all">All</option><option value="outstanding">Outstanding</option><option value="overdue">Overdue</option><option value="paid">Paid</option>
        </select>
        <Button onClick={() => { const n = actions.generateInvoices(dubaiToday()); n ? toast.success(`Generated ${n} invoice(s)`) : toast.info("No new invoices due — nothing duplicated."); }}>Generate due invoices</Button>
      </PageHeader>
      <Table head={["Invoice", "Customer", "Period", "Due", "Amount", "Status"]} empty={!list.length}>
        {list.map((i) => (
          <tr key={i.id}>
            <td className={td}><Link to="/invoices/$id" params={{ id: i.id }} className="font-medium text-primary hover:underline">{i.number}</Link></td>
            <td className={td}>{customers.find((c) => c.id === i.customerId)?.fullName ?? "—"}</td>
            <td className={td}>{fmtDate(i.period)}</td><td className={td}>{fmtDate(i.dueDate)}</td>
            <td className={td}>{aed(i.amount)}</td><td className={td}><Pill v={invoiceState(i)} /></td>
          </tr>
        ))}
      </Table>
    </>
  );
}