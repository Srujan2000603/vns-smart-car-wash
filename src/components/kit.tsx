import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function PageHeader({ title, desc, children }: { title: string; desc?: string | undefined; children?: ReactNode | undefined }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ children, className, title, action }: { children: ReactNode; className?: string | undefined; title?: string | undefined; action?: ReactNode | undefined }) {
  return (
    <section className={cn("rounded-xl border bg-card p-4 shadow-sm sm:p-5", className)}>
      {(title || action) && <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-base font-semibold">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}

const tones: Record<string, string> = {
  active: "bg-success/15 text-success", paid: "bg-success/15 text-success", done: "bg-success/15 text-success", reconciled: "bg-success/15 text-success",
  outstanding: "bg-warning/20 text-warning-foreground", scheduled: "bg-accent text-accent-foreground", requested: "bg-warning/20 text-warning-foreground",
  collected: "bg-secondary text-secondary-foreground", paused: "bg-muted text-muted-foreground", inactive: "bg-muted text-muted-foreground",
  overdue: "bg-destructive/15 text-destructive", cancelled: "bg-destructive/15 text-destructive", skipped: "bg-destructive/10 text-destructive",
  cleaner: "bg-accent text-accent-foreground", supervisor: "bg-secondary text-secondary-foreground",
};
export function Pill({ v }: { v: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", tones[v] ?? "bg-muted text-muted-foreground")}>{v.replace("-", " ")}</span>;
}

export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string | undefined; error?: string | undefined }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-muted-foreground">{hint}</span>}
      {error && <span role="alert" className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}

export function Modal({ open, onClose, title, desc, children }: { open: boolean; onClose: () => void; title: string; desc?: string | undefined; children: ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle>{desc && <DialogDescription>{desc}</DialogDescription>}</DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean | undefined }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
      {empty && <p className="p-6 text-center text-sm text-muted-foreground">No records match.</p>}
    </div>
  );
}
export const td = "px-3 py-2.5 align-middle";

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string | undefined }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-foreground sm:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}