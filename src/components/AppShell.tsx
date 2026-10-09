import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, Building2, Users, UserCog, Car, CalendarCheck, FileText, CreditCard, HandCoins, History, Smartphone, HardHat, Settings, Menu, X, RotateCcw, Briefcase, CalendarRange, ClipboardList, AlarmClock } from "lucide-react";
import { actions, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/companies", label: "Companies", icon: Briefcase, CalendarRange, ClipboardList, AlarmClock },
  { to: "/buildings", label: "Buildings", icon: Building2 },
  { to: "/staff", label: "Staff", icon: UserCog },
  { to: "/customers", label: "Customers", icon: Car },
  { to: "/planner", label: "Weekly Planner", icon: CalendarRange },
  { to: "/roster", label: "Cleaner Roster", icon: ClipboardList },
  { to: "/jobs", label: "Cleaning Jobs", icon: CalendarCheck },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/dues", label: "Dues & Overdue", icon: AlarmClock },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/collections", label: "Collections", icon: HandCoins },
  { to: "/audit", label: "Audit Log", icon: History },
  { to: "/customer-view", label: "Customer View", icon: Smartphone },
  { to: "/staff-view", label: "Staff View", icon: HardHat },
  { to: "/settings", label: "Settings & Integrations", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const companies = useStore((s) => s.companies);
  const companyId = useStore((s) => s.companyId);

  const side = (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-primary-foreground"><Users className="hidden" /><Car className="h-5 w-5" /></div>
        <div><p className="font-display text-sm font-bold text-sidebar-accent-foreground">VNS Smart Car Wash</p><p className="text-xs text-sidebar-foreground/70">Dubai parking ops</p></div>
      </div>
      <label className="block text-xs text-sidebar-foreground/80">
        Company (demo scope)
        <select aria-label="Select company" value={companyId} onChange={(e) => { actions.setCompany(e.target.value); toast.success("Switched company"); }}
          className="mt-1 w-full rounded-md border border-sidebar-border bg-sidebar-accent px-2 py-2 text-sm text-sidebar-accent-foreground">
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <nav className="flex-1 space-y-0.5 overflow-y-auto" aria-label="Main">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} onClick={() => setOpen(false)} activeOptions={{ exact: to === "/" }}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-primary font-semibold" }}>
            <Icon className="h-4 w-4" />{label}
          </Link>
        ))}
      </nav>
      <Button variant="outline" size="sm" className="border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={() => { if (confirm("Reset all demo data to the original sample records?")) { actions.reset(); toast.success("Demo data reset"); } }}>
        <RotateCcw className="h-4 w-4" /> Reset Demo Data
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-sidebar lg:block">{side}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 bg-sidebar">
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-4 text-sidebar-foreground"><X className="h-5 w-5" /></button>
            {side}
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b bg-warning px-4 py-2 text-xs font-semibold text-warning-foreground sm:text-sm">
          <button aria-label="Open menu" className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <span>DEMO MODE · SAMPLE DATA · Fictional records stored only in this browser. No real payments, bank settlements or notifications.</span>
        </div>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}