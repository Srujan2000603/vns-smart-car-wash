import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Pill } from "@/components/kit";
import { PayOptions } from "@/components/PayOptions";
import { aed, fmtDate, fmtDateTime, invoiceState, useScoped } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/invoices/$id")({ head: meta("Invoice details", "Invoice details and payment options."), component: Detail });

function Detail() {
  const { id } = Route.useParams();
  const { invoices, customers, txns, collections } = useScoped();
  const inv = invoices.find((i) => i.id === id);
  if (!inv) return <p>Invoice not found in this company. <Link to="/invoices" className="text-primary">Back</Link></p>;
  const c = customers.find((x) => x.id === inv.customerId);
  return (
    <>
      <PageHeader title={`Invoice ${inv.number}`} desc={c?.fullName}><Link to="/invoices" className="text-sm text-primary">← All invoices</Link></PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Details">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Status</dt><dd><Pill v={invoiceState(inv)} /></dd>
            <dt className="text-muted-foreground">Amount</dt><dd className="font-semibold">{aed(inv.amount)}</dd>
            <dt className="text-muted-foreground">Period start</dt><dd>{fmtDate(inv.period)}</dd>
            <dt className="text-muted-foreground">Due date</dt><dd>{fmtDate(inv.dueDate)}</dd>
            <dt className="text-muted-foreground">Vehicle</dt><dd>{c?.plate}</dd>
            <dt className="text-muted-foreground">Paid at</dt><dd>{fmtDateTime(inv.paidAt)}</dd>
            <dt className="text-muted-foreground">Demo pay link</dt><dd className="break-all font-mono text-xs">/checkout/{inv.payToken}</dd>
          </dl>
        </Panel>
        <Panel title="Payment options"><PayOptions inv={inv} />
          <h3 className="mt-4 text-sm font-semibold">History</h3>
          <ul className="mt-1 space-y-1 text-sm">
            {txns.filter((t) => t.invoiceId === id).map((t) => <li key={t.id}>{t.method} · {t.ref} · {fmtDateTime(t.at)}</li>)}
            {collections.filter((x) => x.invoiceId === id).map((x) => <li key={x.id}>{x.method} request · {x.status}</li>)}
          </ul>
        </Panel>
      </div>
    </>
  );
}