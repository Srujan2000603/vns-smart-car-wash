import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Table, td } from "@/components/kit";
import { aed, fmtDateTime, useScoped } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/payments")({ head: meta("Payments", "Demo payment history."), component: Payments });

function Payments() {
  const { txns, invoices } = useScoped();
  return (
    <>
      <PageHeader title="Payment history" desc="Demo transactions only — simulated online, reconciled cash and card-tap." />
      <Table head={["Reference", "Invoice", "Method", "Amount", "When"]} empty={!txns.length}>
        {[...txns].sort((a, b) => b.at.localeCompare(a.at)).map((t) => (
          <tr key={t.id}><td className={td + " font-mono text-xs"}>{t.ref}</td><td className={td}>{invoices.find((i) => i.id === t.invoiceId)?.number}</td>
            <td className={td}>{t.method}</td><td className={td}>{aed(t.amount)}</td><td className={td}>{fmtDateTime(t.at)}</td></tr>
        ))}
      </Table>
    </>
  );
}