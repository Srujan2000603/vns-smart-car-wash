import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/kit";
import { actions, aed, useStore } from "@/lib/store";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/companies")({ head: meta("Companies", "Switch between demo car wash companies with separate data."), component: Companies });

function Companies() {
  const s = useStore((x) => x);
  return (
    <>
      <PageHeader title="Companies" desc="Each fictional company has its own buildings, staff, customers, jobs and invoices." />
      <div className="grid gap-4 md:grid-cols-2">
        {s.companies.map((c) => {
          const cust = s.customers.filter((x) => x.companyId === c.id);
          const out = s.invoices.filter((i) => i.companyId === c.id && i.status === "unpaid").reduce((a, i) => a + i.amount, 0);
          const cur = s.companyId === c.id;
          return (
            <Panel key={c.id} className={cur ? "ring-2 ring-primary" : ""}>
              <h2 className="text-lg font-semibold">{c.name}</h2>
              <p className="text-sm text-muted-foreground">{c.city}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div><dt className="text-muted-foreground">Buildings</dt><dd className="font-semibold">{s.buildings.filter((b) => b.companyId === c.id).length}</dd></div>
                <div><dt className="text-muted-foreground">Customers</dt><dd className="font-semibold">{cust.length}</dd></div>
                <div><dt className="text-muted-foreground">Outstanding</dt><dd className="font-semibold">{aed(out)}</dd></div>
              </dl>
              <Button className="mt-4" disabled={cur} onClick={() => { actions.setCompany(c.id); toast.success(`Now viewing ${c.name}`); }}>{cur ? "Currently selected" : "Switch to this company"}</Button>
            </Panel>
          );
        })}
      </div>
    </>
  );
}