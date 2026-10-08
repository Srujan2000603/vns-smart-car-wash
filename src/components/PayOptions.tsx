import { Link } from "@tanstack/react-router";
import { actions, type Invoice } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PayOptions({ inv }: { inv: Invoice }) {
  if (inv.status === "paid") return <p className="text-sm text-success">Paid — no action needed.</p>;
  const req = (m: "cash" | "card-tap") => {
    const r = actions.requestCollection(inv.id, m);
    if (r === "ok") toast.success(`${m === "cash" ? "Cash" : "Card-tap"} collection requested`);
    else if (r === "dup") toast.info("A collection request is already open for this invoice.");
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm"><Link to="/checkout/$token" params={{ token: inv.payToken }}>Online demo checkout</Link></Button>
      <Button size="sm" variant="outline" onClick={() => req("cash")}>Request cash collection</Button>
      <Button size="sm" variant="outline" onClick={() => req("card-tap")}>Request card-tap</Button>
    </div>
  );
}