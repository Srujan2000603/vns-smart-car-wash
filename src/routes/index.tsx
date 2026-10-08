import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel, Stat, Pill } from "@/components/kit";
import { aed, dubaiToday, fmtDate, invoiceState, useScoped } from "@/lib/store";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ head: meta("Dashboard", "Live KPIs for subscriptions, billing and washes."), component: Dashboard });

function Dashboard() {
  const { company, customers, invoices, jobs, buildings } = useScoped();
  const t = dubaiToday(); const month = t.slice(0, 7);
  const active = customers.filter((c) => c.status === "active");
  const monthInv = invoices.filter((i) => i.issueDate.startsWith(month));
  const billed = monthInv.reduce((a, i) => a + i.amount, 0);
  const paid = invoices.filter((i) => i.status === "paid" && i.paidAt?.startsWith(month)).reduce((a, i) => a + i.amount, 0);
  const outstanding = invoices.filter((i) => i.status === "unpaid").reduce((a, i) => a + i.amount, 0);
  const overdue = invoices.filter((i) => invoiceState(i) === "overdue");
  const todayJobs = jobs.filter((j) => j.date === t);
  const byBuilding = buildings.map((b) => {
    const ids = new Set(customers.filter((c) => c.buildingId === b.id).map((c) => c.id));
    const inv = invoices.filter((i) => ids.has(i.customerId));
    return { name: b.name, Billed: inv.reduce((a, i) => a + i.amount, 0), Paid: inv.filter((i) => i.status === "paid").reduce((a, i) => a + i.amount, 0) };
  });
  return (
    <>
      <PageHeader title="Dashboard" desc={`${company.name} · ${fmtDate(t)} (Dubai)`}>
        <Button asChild variant="outline"><Link to="/jobs">Today's jobs</Link></Button>
        <Button asChild><Link to="/invoices">Invoices</Link></Button>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Active subscriptions" value={String(active.length)} sub={`${customers.length} customers total`} />
        <Stat label="Billed this month" value={aed(billed)} sub={`${monthInv.length} invoices`} />
        <Stat label="Paid this month" value={aed(paid)} />
        <Stat label="Outstanding" value={aed(outstanding)} sub={`${overdue.length} overdue`} />
        <Stat label="Scheduled today" value={String(todayJobs.filter((j) => j.status === "scheduled").length)} />
        <Stat label="Completed today" value={String(todayJobs.filter((j) => j.status === "done").length)} sub={`${jobs.filter((j) => j.status === "done").length} all-time`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Revenue by building (all invoices)" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byBuilding}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => aed(v)} />
                <Bar dataKey="Billed" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Paid" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Overdue invoices" action={<Link to="/invoices" className="text-sm font-medium text-primary">View all</Link>}>
          {overdue.length === 0 ? <p className="text-sm text-muted-foreground">Nothing overdue.</p> : (
            <ul className="divide-y">
              {overdue.slice(0, 6).map((i) => { const c = customers.find((x) => x.id === i.customerId);
                return <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                  <Link to="/invoices/$id" params={{ id: i.id }} className="hover:underline"><span className="font-medium">{i.number}</span><span className="block text-xs text-muted-foreground">{c?.fullName}</span></Link>
                  <span className="text-right"><span className="block font-semibold">{aed(i.amount)}</span><Pill v="overdue" /></span>
                </li>; })}
            </ul>)}
        </Panel>
      </div>
    </>
  );
}