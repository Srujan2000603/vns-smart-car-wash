import { useSyncExternalStore } from "react";

export type Company = { id: string; name: string; city: string };
export type Building = { id: string; companyId: string; name: string; area: string; parkingLevels: number };
export type Role = "cleaner" | "supervisor";
export type Staff = { id: string; companyId: string; name: string; role: Role; phone: string; active: boolean };
export type CustStatus = "active" | "paused" | "cancelled";
export type Customer = {
  id: string; companyId: string; fullName: string; contact: string; buildingId: string; parking: string;
  plate: string; frequency: number; weekdays: number[]; price: number; startDate: string; nextDueDate: string;
  cleanerId: string; supervisorId: string; status: CustStatus; notes: string;
};
export type JobStatus = "scheduled" | "done" | "skipped";
export type Job = { id: string; companyId: string; customerId: string; date: string; cleanerId: string; status: JobStatus; reason?: string; at?: string };
export type Invoice = { id: string; companyId: string; number: string; customerId: string; period: string; issueDate: string; dueDate: string; amount: number; status: "unpaid" | "paid"; paidAt?: string; payToken: string };
export type Method = "online-demo" | "cash" | "card-tap";
export type Txn = { id: string; companyId: string; invoiceId: string; ref: string; method: Method; amount: number; at: string };
export type Collection = { id: string; companyId: string; invoiceId: string; method: "cash" | "card-tap"; status: "requested" | "collected" | "reconciled"; requestedAt: string; collectedAt?: string; collectedBy?: string; reconciledAt?: string };
export type Audit = { id: string; companyId: string; at: string; action: string; detail: string };

export type State = {
  companyId: string; seq: number; companies: Company[]; buildings: Building[]; staff: Staff[]; customers: Customer[];
  jobs: Job[]; invoices: Invoice[]; txns: Txn[]; collections: Collection[]; audit: Audit[];
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const KEY = "vns-demo-v1";

// ---------- date helpers (Dubai) ----------
export function dubaiToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function nowIso() { return new Date().toISOString(); }
export function addDays(d: string, n: number) { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
export function addMonths(d: string, n: number) {
  const x = new Date(d + "T00:00:00Z"); const day = x.getUTCDate(); x.setUTCDate(1); x.setUTCMonth(x.getUTCMonth() + n);
  const last = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate(); x.setUTCDate(Math.min(day, last));
  return x.toISOString().slice(0, 10);
}
export function weekday(d: string) { return new Date(d + "T00:00:00Z").getUTCDay(); }
export function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}
export function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " GST";
}
export function aed(n: number) { return "AED " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
export function isOverdue(i: Invoice) { return i.status === "unpaid" && i.dueDate < dubaiToday(); }
export function invoiceState(i: Invoice): "paid" | "overdue" | "outstanding" { return i.status === "paid" ? "paid" : isOverdue(i) ? "overdue" : "outstanding"; }

// ---------- seed ----------
function seed(): State {
  const t = dubaiToday();
  const s: State = {
    companyId: "c1", seq: 1000,
    companies: [
      { id: "c1", name: "Marina Shine Services (Fictional)", city: "Dubai Marina" },
      { id: "c2", name: "Downtown Gleam LLC (Fictional)", city: "Downtown Dubai" },
    ],
    buildings: [
      { id: "b1", companyId: "c1", name: "Marina Pearl Tower", area: "Dubai Marina", parkingLevels: 4 },
      { id: "b2", companyId: "c1", name: "JBR Sands Residence", area: "JBR", parkingLevels: 3 },
      { id: "b3", companyId: "c2", name: "Boulevard Crest", area: "Downtown Dubai", parkingLevels: 5 },
    ],
    staff: [
      { id: "s1", companyId: "c1", name: "Ravi Kumar", role: "cleaner", phone: "+971 50 000 1101", active: true },
      { id: "s2", companyId: "c1", name: "Imran Sheikh", role: "supervisor", phone: "+971 50 000 1102", active: true },
      { id: "s3", companyId: "c2", name: "Joseph Mensah", role: "cleaner", phone: "+971 55 000 2201", active: true },
      { id: "s4", companyId: "c2", name: "Aisha Rahman", role: "supervisor", phone: "+971 55 000 2202", active: true },
    ],
    customers: [], jobs: [], invoices: [], txns: [], collections: [], audit: [],
  };
  const names = ["Omar Al Falasi", "Priya Nair", "James Carter", "Fatima Hassan", "Li Wei", "Ahmed Khan", "Sara Lopez", "Yousef Darwish", "Elena Petrova", "Rahul Mehta", "Noura Saeed", "Daniel Smith", "Mariam Ali", "Kenji Sato", "Hana Yusuf", "Victor Silva"];
  const sets: number[][] = [[1, 4], [0, 2, 4], [1, 3, 5], [6], [0, 1, 2, 3, 4], [2, 5], [1, 2, 3, 4, 5, 6], [3], [0, 3], [1, 3, 5, 0], [2, 4, 6], [5], [0, 1, 2, 3, 4, 5, 6], [1, 5], [2, 4], [0, 2, 4, 6]];
  const prices = [250, 320, 320, 150, 450, 250, 550, 150, 250, 380, 320, 150, 600, 250, 250, 380];
  const dueOffsets = [-35, -20, -12, -5, -2, 0, 3, 8, 15, 22, -40, -8, -1, 5, 12, 25];
  names.forEach((n, i) => {
    const c1 = i < 11; const comp = c1 ? "c1" : "c2";
    const due = addDays(t, dueOffsets[i]);
    s.customers.push({
      id: "cu" + (i + 1), companyId: comp, fullName: n + " (Sample)", contact: `+971 5${i % 9} 555 ${String(1000 + i * 37).slice(0, 4)}`,
      buildingId: c1 ? (i % 2 ? "b2" : "b1") : "b3", parking: `P${(i % 4) + 1}-${100 + i * 3}`,
      plate: `DXB ${String.fromCharCode(65 + (i % 26))} ${10000 + i * 731}`, frequency: sets[i].length, weekdays: sets[i], price: prices[i],
      startDate: addMonths(due, -3), nextDueDate: due, cleanerId: c1 ? "s1" : "s3", supervisorId: c1 ? "s2" : "s4",
      status: i === 9 ? "paused" : "active", notes: i % 5 === 0 ? "Prefers early morning wash before 7am." : "",
    });
  });
  // historical invoices: generate for everyone due within last 45 days
  for (const comp of ["c1", "c2"]) { s.companyId = comp; Object.assign(s, genInvoices(s, t).state); }
  // pay some
  s.invoices.forEach((inv, i) => {
    if (i % 3 === 0) {
      const at = new Date(Date.now() - (i + 1) * 3600e3 * 20).toISOString();
      inv.status = "paid"; inv.paidAt = at;
      s.txns.push({ id: "tx" + i, companyId: inv.companyId, invoiceId: inv.id, ref: `DEMO-TXN-${(70000 + i * 13).toString(36).toUpperCase()}`, method: i % 2 ? "cash" : "online-demo", amount: inv.amount, at });
    }
  });
  const open = s.invoices.find((i) => i.status === "unpaid" && i.companyId === "c1");
  if (open) s.collections.push({ id: "co1", companyId: "c1", invoiceId: open.id, method: "cash", status: "requested", requestedAt: nowIso() });
  // jobs: yesterday + today
  for (const comp of ["c1", "c2"]) {
    s.companyId = comp;
    Object.assign(s, genJobs(s, addDays(t, -1)).state);
    Object.assign(s, genJobs(s, t).state);
  }
  s.jobs.forEach((j, i) => { if (j.date < t) { j.status = i % 4 === 3 ? "skipped" : "done"; j.reason = j.status === "skipped" ? "Car not in parking bay" : undefined; j.at = nowIso(); } });
  s.audit = [{ id: "a0", companyId: "c1", at: nowIso(), action: "Demo seeded", detail: "Fictional sample data loaded" }, { id: "a1", companyId: "c2", at: nowIso(), action: "Demo seeded", detail: "Fictional sample data loaded" }];
  s.companyId = "c1";
  return s;
}

function nid(s: State, p: string) { s.seq += 1; return p + s.seq.toString(36); }
function token() { return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 6)).join(""); }
function log(s: State, action: string, detail: string) { s.audit.unshift({ id: nid(s, "a"), companyId: s.companyId, at: nowIso(), action, detail }); }

export function genJobs(prev: State, date: string) {
  const s = structuredClone(prev); let created = 0;
  const wd = weekday(date);
  for (const c of s.customers) {
    if (c.companyId !== s.companyId || c.status !== "active" || c.startDate > date || !c.weekdays.includes(wd)) continue;
    if (s.jobs.some((j) => j.customerId === c.id && j.date === date)) continue;
    s.jobs.push({ id: nid(s, "j"), companyId: s.companyId, customerId: c.id, date, cleanerId: c.cleanerId, status: "scheduled" });
    created++;
  }
  return { state: s, created };
}

export function genInvoices(prev: State, asOf: string) {
  const s = structuredClone(prev); let created = 0;
  for (const c of s.customers) {
    if (c.companyId !== s.companyId || c.status !== "active") continue;
    let guard = 0;
    while (c.nextDueDate <= asOf && guard++ < 12) {
      if (!s.invoices.some((i) => i.customerId === c.id && i.period === c.nextDueDate)) {
        const n = s.invoices.filter((i) => i.companyId === s.companyId).length + 1;
        s.invoices.push({
          id: nid(s, "i"), companyId: s.companyId, number: `${s.companyId === "c1" ? "MSS" : "DGL"}-${String(n).padStart(4, "0")}`,
          customerId: c.id, period: c.nextDueDate, issueDate: c.nextDueDate, dueDate: addDays(c.nextDueDate, 7), amount: c.price, status: "unpaid", payToken: token(),
        });
        created++;
      }
      c.nextDueDate = addMonths(c.nextDueDate, 1);
    }
  }
  return { state: s, created };
}

// ---------- store ----------
let state: State | null = null;
const serverState = seed();
const listeners = new Set<() => void>();
function load(): State {
  if (state) return state;
  if (typeof window === "undefined") return serverState;
  try { const raw = localStorage.getItem(KEY); state = raw ? JSON.parse(raw) : seed(); } catch { state = seed(); }
  return state!;
}
function set(next: State) { state = next; try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ } listeners.forEach((l) => l()); }
export function getState() { return load(); }
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => sel(load()), () => sel(serverState));
}
export function useScoped() {
  const s = useStore((x) => x);
  const c = s.companyId; const f = <T extends { companyId: string }>(a: T[]) => a.filter((x) => x.companyId === c);
  return { s, company: s.companies.find((x) => x.id === c)!, buildings: f(s.buildings), staff: f(s.staff), customers: f(s.customers), jobs: f(s.jobs), invoices: f(s.invoices), txns: f(s.txns), collections: f(s.collections), audit: f(s.audit) };
}
function mutate(fn: (s: State) => void) { const s = structuredClone(load()); fn(s); set(s); }

type Kind = "buildings" | "staff" | "customers";
export const actions = {
  reset() { localStorage.removeItem(KEY); set(seed()); },
  setCompany(id: string) { mutate((s) => { s.companyId = id; }); },
  upsert<K extends Kind>(kind: K, rec: Omit<State[K][number], "id" | "companyId"> & { id?: string }) {
    mutate((s) => {
      const arr = s[kind] as unknown as { id: string; companyId: string }[];
      const label = (rec as { name?: string; fullName?: string }).name ?? (rec as { fullName?: string }).fullName ?? "";
      if (rec.id) { const i = arr.findIndex((x) => x.id === rec.id); arr[i] = { ...arr[i], ...rec }; log(s, `Updated ${kind.replace(/s$/, "")}`, label); }
      else { arr.push({ ...rec, id: nid(s, kind[0]), companyId: s.companyId } as never); log(s, `Created ${kind.replace(/s$/, "")}`, label); }
    });
  },
  remove(kind: Kind, id: string) {
    mutate((s) => {
      const arr = s[kind] as unknown as { id: string; name?: string; fullName?: string }[];
      const r = arr.find((x) => x.id === id); (s[kind] as unknown) = arr.filter((x) => x.id !== id);
      log(s, `Deleted ${kind.replace(/s$/, "")}`, r?.name ?? r?.fullName ?? id);
    });
  },
  toggleStaff(id: string) { mutate((s) => { const x = s.staff.find((y) => y.id === id)!; x.active = !x.active; log(s, "Staff status", `${x.name} → ${x.active ? "active" : "inactive"}`); }); },
  generateJobs(date: string) { const r = genJobs(load(), date); if (r.created) log(r.state, "Generated jobs", `${r.created} job(s) for ${fmtDate(date)}`); set(r.state); return r.created; },
  setJob(id: string, status: JobStatus, reason?: string) {
    mutate((s) => { const j = s.jobs.find((x) => x.id === id)!; j.status = status; j.reason = reason; j.at = status === "scheduled" ? undefined : nowIso();
      const c = s.customers.find((x) => x.id === j.customerId); log(s, `Job ${status}`, `${c?.plate ?? ""} ${fmtDate(j.date)}${reason ? " — " + reason : ""}`); });
  },
  generateInvoices(asOf: string) { const r = genInvoices(load(), asOf); log(r.state, "Generated invoices", `${r.created} new invoice(s) up to ${fmtDate(asOf)}`); set(r.state); return r.created; },
  simulatePayment(invoiceId: string): string | null {
    let ref: string | null = null;
    mutate((s) => {
      const inv = s.invoices.find((x) => x.id === invoiceId); if (!inv || inv.status === "paid") return;
      ref = `DEMO-TXN-${Date.now().toString(36).toUpperCase()}-${token().slice(0, 4).toUpperCase()}`;
      const at = nowIso(); inv.status = "paid"; inv.paidAt = at;
      s.txns.unshift({ id: nid(s, "t"), companyId: inv.companyId, invoiceId, ref, method: "online-demo", amount: inv.amount, at });
      s.collections.filter((c) => c.invoiceId === invoiceId && c.status !== "reconciled").forEach((c) => { s.collections = s.collections.filter((x) => x.id !== c.id); });
      log(s, "Demo payment simulated", `${inv.number} ${aed(inv.amount)} ref ${ref}`);
    });
    return ref;
  },
  requestCollection(invoiceId: string, method: "cash" | "card-tap"): "ok" | "dup" | "paid" {
    const s0 = load(); const inv = s0.invoices.find((x) => x.id === invoiceId);
    if (!inv || inv.status === "paid") return "paid";
    if (s0.collections.some((c) => c.invoiceId === invoiceId && c.status !== "reconciled")) return "dup";
    mutate((s) => { s.collections.unshift({ id: nid(s, "co"), companyId: inv.companyId, invoiceId, method, status: "requested", requestedAt: nowIso() }); log(s, "Collection requested", `${inv.number} via ${method}`); });
    return "ok";
  },
  markCollected(id: string, staffId: string) {
    mutate((s) => { const c = s.collections.find((x) => x.id === id)!; if (c.status !== "requested") return; c.status = "collected"; c.collectedAt = nowIso(); c.collectedBy = staffId;
      const inv = s.invoices.find((x) => x.id === c.invoiceId); log(s, "Marked collected (supervisor)", `${inv?.number} by ${s.staff.find((x) => x.id === staffId)?.name}`); });
  },
  reconcile(id: string) {
    mutate((s) => { const c = s.collections.find((x) => x.id === id)!; if (c.status !== "collected") return; const inv = s.invoices.find((x) => x.id === c.invoiceId)!;
      c.status = "reconciled"; c.reconciledAt = nowIso();
      if (inv.status !== "paid") { inv.status = "paid"; inv.paidAt = c.reconciledAt;
        s.txns.unshift({ id: nid(s, "t"), companyId: inv.companyId, invoiceId: inv.id, ref: `DEMO-${c.method === "cash" ? "CASH" : "TAP"}-${Date.now().toString(36).toUpperCase()}`, method: c.method, amount: inv.amount, at: c.reconciledAt }); }
      log(s, "Admin reconciled collection", `${inv.number} settled (${c.method})`); });
  },
};