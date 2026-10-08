import { Pill, Table, td } from "@/components/kit";
import { actions, aed, fmtDateTime, useScoped, type Collection } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CollectionsTable({ rows, admin, supervisorId }: { rows: Collection[]; admin?: boolean; supervisorId?: string }) {
  const { invoices, customers, staff } = useScoped();
  return (
    <Table head={["Invoice", "Customer", "Method", "Amount", "Status", "Action"]} empty={!rows.length}>
      {rows.map((c) => {
        const inv = invoices.find((i) => i.id === c.invoiceId); const cu = customers.find((x) => x.id === inv?.customerId);
        return (
          <tr key={c.id}>
            <td className={td}>{inv?.number}</td><td className={td}>{cu?.fullName}<p className="text-xs text-muted-foreground">{cu?.plate}</p></td>
            <td className={td}>{c.method}</td><td className={td}>{inv && aed(inv.amount)}</td>
            <td className={td}><Pill v={c.status} /><p className="text-xs text-muted-foreground">{c.collectedBy && `by ${staff.find((s) => s.id === c.collectedBy)?.name} ${fmtDateTime(c.collectedAt)}`}</p></td>
            <td className={td}>
              {c.status === "requested" && <Button size="sm" variant="outline" onClick={() => { actions.markCollected(c.id, supervisorId ?? cu?.supervisorId ?? ""); toast.success("Marked collected"); }}>Supervisor: mark collected</Button>}
              {c.status === "collected" && admin && <Button size="sm" onClick={() => { actions.reconcile(c.id); toast.success("Reconciled — invoice settled"); }}>Admin: reconcile & settle</Button>}
              {c.status === "collected" && !admin && <span className="text-xs text-muted-foreground">Awaiting admin</span>}
            </td>
          </tr>
        );
      })}
    </Table>
  );
}