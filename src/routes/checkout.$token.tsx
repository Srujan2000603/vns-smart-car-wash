import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Panel } from "@/components/kit";
import { actions, aed, useStore } from "@/lib/store";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/$token")({ head: meta("Demo checkout", "Payment simulator — no real money moves."), component: Checkout });

function Checkout() {
  const { token } = Route.useParams();
  const inv = useStore((s) => s.invoices.find((i) => i.payToken === token));
  const [ref, setRef] = useState<string | null>(null);
  if (!inv) return <p>Unknown demo link.</p>;
  return (
    <div className="mx-auto max-w-md">
      <Panel title="DEMO CHECKOUT — SIMULATOR ONLY">
        <p className="rounded-md bg-warning/20 p-3 text-sm">This is not a real payment page. No card is charged and no bank is contacted.</p>
        <p className="mt-4 text-sm">Invoice <b>{inv.number}</b></p>
        <p className="font-display text-3xl font-bold">{aed(inv.amount)}</p>
        {inv.status === "paid" ? <p className="mt-4 text-success">Invoice closed.{ref && <> Demo reference: <b className="font-mono">{ref}</b></>}</p>
          : <Button className="mt-4 w-full" onClick={() => setRef(actions.simulatePayment(inv.id))}>Simulate completed payment</Button>}
        <Link to="/invoices/$id" params={{ id: inv.id }} className="mt-4 block text-sm text-primary">← Back to invoice</Link>
      </Panel>
    </div>
  );
}