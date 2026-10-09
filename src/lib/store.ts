import { useSyncExternalStore } from "react";

export type Company = { id: string; name: string; city: string };
export type Building = { id: string; companyId: string; name: string; area: string; parkingLevels: number };
export type Role = "cleaner" | "supervisor";
export type Staff = { id: string; companyId: string; name: string; role: Role; phone: string; active: boolean };
export type CustStatus = "active" | "paused" | "cancelled";
export type VehicleClass = "sedan" | "suv";
export type Customer = {
  id: string; companyId: string; fullName: string; contact: string; buildingId: string; parking: string;
  plate: string; vehicleClass: VehicleClass; frequency: number; weekdays: number[]; price: number; startDate: string; nextDueDate: string;
  cleanerId: string; supervisorId: string; status: CustStatus; notes: string;
};
export type JobStatus = "scheduled" | "done" | "skipped";
export type Job = { id: string; companyId: string; customerId: string; date: string; cleanerId: string; status: JobStatus; reason?: string | undefined; at?: string | undefined };
export type Extension = { at: string; from: string; to: string; reason: string };
export type Invoice = {
  id: string; companyId: string; number: string; customerId: string; period: string; periodEnd: string; issueDate: string;
  dueDate: string; extendedDueDate?: string | undefined; extensions: Extension[];
  amount: number; status: "unpaid" | "paid"; paidAt?: string | undefined; payToken: string;
};
export type Method = "online-demo" | "cash" | "card-tap";
export type Txn = { id: string; companyId: string; invoiceId: string; ref: string; method: Method; amount: number; at: string };
export type Collection = { id: string; companyId: string; invoiceId: string; method: "cash" | "card-tap"; status: "requested" | "collected" | "reconciled"; requestedAt: string; collectedAt?: string | undefined; collectedBy?: string | undefined; reconciledAt?: string | undefined };
export type Audit = { id: string; companyId: string; at: string; action: string; detail: string };

export type State = {
  companyId: string; seq: number; companies: Company[]; buildings: Building[]; staff: Staff[]; customers: Customer[];
  jobs: Job[]; invoices: Invoice[]; txns: Txn[]; collections: Collection[]; audit: Audit[];
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WORK_DAYS = [0, 2, 3, 4, 5, 6]; // Monday (1) is OFF
export const PRICES: Record<VehicleClass, number> = { sedan: 150, suv: 200 };
export const CAPACITY = { min: 30, max: 40 };
const KEY = "vns-demo-v2";

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
export function effectiveDue(i: Invoice) { return i.extendedDueDate ?? i.dueDate; }
export function isOverdue(i: Invoice) { return i.status === "unpaid" && effectiveDue(i) < dubaiToday(); }
export function invoiceState(i: Invoice): "paid" | "overdue" | "outstanding" { return i.status === "paid" ? "paid" : isOverdue(i) ? "overdue" : "outstanding"; }
export function telHref(phone: string) { return "tel:" + phone.replace(/[^\d+]/g, ""); }

// ---------- balanced daily routing ----------
/** Splits all active cars due on `day` into contiguous, near-equal chunks across active cleaners (ordered by building, then parking). */
export function dayAssignments(customers: Customer[], buildings: Building[], cleaners: Staff[], day: number) {
  const order = new Map(buildings.map((b, i) => [b.id, i]));
  const due = customers
    .filter((c) => c.status === "active" && day !== 1 && c.weekdays.includes(day))
    .sort((a, b) => (order.get(a.buildingId) ?? 0) - (order.get(b.buildingId) ?? 0) || a.parking.localeCompare(b.parking, undefined, { numeric: true }));
  const active = cleaners.filter((s) => s.role === "cleaner" && s.active);
  const out = new Map<string, Customer[]>(active.map((s) => [s.id, []]));
  if (!active.length) return { out, due, unassigned: due };
  const base = Math.floor(due.length / active.length); const extra = due.length % active.length;
  let k = 0;
  active.forEach((s, i) => { const n = base + (i < extra ? 1 : 0); out.set(s.id, due.slice(k, k + n)); k += n; });
  return { out, due, unassigned: [] as Customer[] };
}

// ---------- deterministic seed ----------
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const FIRST = ["Omar", "Priya", "James", "Fatima", "Wei", "Ahmed", "Sara", "Yousef", "Elena", "Rahul", "Noura", "Daniel", "Mariam", "Kenji", "Hana", "Victor", "Layla", "Arjun", "Sofia", "Khalid", "Anna", "Ravi", "Zainab", "Lucas", "Meera", "Hassan", "Chloe", "Vikram", "Amira", "Tom", "Reem", "Imran", "Grace", "Saif", "Nadia", "Ali", "Olivia", "Karan", "Salma", "Ben"];
const LAST = ["Al Falasi", "Nair", "Carter", "Hassan", "Li", "Khan", "Lopez", "Darwish", "Petrova", "Mehta", "Saeed", "Smith", "Ali", "Sato", "Yusuf", "Silva", "Haddad", "Pillai", "Rossi", "Al Mansoori", "Novak", "Iyer", "Qureshi", "Martin", "Shah", "Rahman", "Dubois", "Reddy", "Farouk", "Brown"];
const AREAS = ["Dubai Marina", "JBR", "JLT", "Business Bay", "Downtown Dubai", "Al Barsha", "Dubai Hills", "Jumeirah Village Circle", "Al Nahda", "Mirdif"];
const BNAMES = ["Pearl", "Sands", "Crest", "Horizon", "Palm View", "Azure", "Marina Gate", "Oasis", "Falcon", "Skyline", "Lagoon", "Emerald", "Coral", "Sapphire", "Dune", "Harbour", "Zenith", "Vista", "Meadow", "Lotus", "Opal", "Cedar", "Breeze", "Summit", "Jasmine", "Orchid", "Sunrise", "Bay"];
const PAIRS: number[][] = [[0, 3], [2, 5], [4, 6]]; // Sun+Wed, Tue+Fri, Thu+Sat
const CLEANER_NAMES = ["Ravi Kumar", "Joseph Mensah", "Anil Thapa", "Bilal Ahmed", "Santosh Rai", "Mohammed Rafiq", "Dinesh Perera", "Kofi Boateng", "Suresh Babu", "Arif Hossain", "Ramesh Gurung", "Faisal Iqbal", "Manoj Pillai", "Samuel Owusu", "Prakash Shrestha", "Tariq Mahmood", "Nimal Silva", "Abdul Karim", "Vijay Nair", "Emmanuel Asante", "Hari Lama", "Yaw Mensah", "Kamal Uddin", "Rajesh Das"];

function seed(): State {
  const t = dubaiToday(); const r = rng(20261009);
  const s: State = {
    companyId: "c1", seq: 1000,
    companies: [
      { id: "c1", name: "Marina Shine Services (Fictional)", city: "Dubai Marina & New Dubai" },
      { id: "c2", name: "Downtown Gleam LLC (Fictional)", city: "Downtown Dubai" },
    ],
    buildings: [], staff: [], customers: [], jobs: [], invoices: [], txns: [], collections: [], audit: [],
  };
  const plan = [{ comp: "c1", buildings: 25, cleaners: 20 }, { comp: "c2", buildings: 3, cleaners: 4 }];
  let cn = 0; let car = 0;
  plan.forEach((p, pi) => {
    const sup1 = `${p.comp}-sup1`;
    s.staff.push({ id: sup1, companyId: p.comp, name: pi ? "Aisha Rahman" : "Imran Sheikh", role: "supervisor", phone: `+971 50 100 ${2000 + pi}`, active: true });
    const cleanerIds: string[] = [];
    for (let i = 0; i < p.cleaners; i++) {
      const id = `${p.comp}-cl${i + 1}`; cleanerIds.push(id);
      s.staff.push({ id, companyId: p.comp, name: CLEANER_NAMES[cn % CLEANER_NAMES.length] ?? `Cleaner ${cn}`, role: "cleaner", phone: `+971 55 200 ${String(3000 + cn).padStart(4, "0")}`, active: true });
      cn++;
    }
    for (let b = 0; b < p.buildings; b++) {
      const bid = `${p.comp}-b${b + 1}`; const idx = pi * 25 + b;
      s.buildings.push({ id: bid, companyId: p.comp, name: `${BNAMES[idx % BNAMES.length]} Residence ${b + 1}`, area: AREAS[idx % AREAS.length] ?? "Dubai", parkingLevels: 2 + (idx % 4) });
      const cars = 60 + Math.floor(r() * 41); // 60–100
      for (let k = 0; k < cars; k++) {
        const x = r(); const pair = x < 0.45 ? PAIRS[0]! : x < 0.78 ? PAIRS[1]! : PAIRS[2]!;
        const cls: VehicleClass = r() < 0.38 ? "suv" : "sedan";
        const dueOffset = Math.floor(r() * 31) - 23; // -23 … +7 days
        const due = addDays(t, dueOffset);
        s.customers.push({
          id: `cu${car + 1}`, companyId: p.comp, fullName: `${FIRST[car % FIRST.length]} ${LAST[(car * 7 + Math.floor(car / 40)) % LAST.length]}`,
          contact: `+971 5${car % 6} ${String(100 + (car * 37) % 900)} ${String(1000 + (car * 7919) % 9000)}`,
          buildingId: bid, parking: `B${1 + (k % (2 + (idx % 4)))}-${String(k + 1).padStart(3, "0")}`,
          plate: `DXB ${String.fromCharCode(65 + (car % 26))} ${String(10000 + car * 13).slice(-5)}`, vehicleClass: cls,
          frequency: 2, weekdays: [...pair], price: PRICES[cls], startDate: addMonths(due, -2), nextDueDate: due,
          cleanerId: cleanerIds[b % cleanerIds.length]!, supervisorId: sup1,
          status: r() < 0.03 ? "paused" : "active", notes: "",
        });
        car++;
      }
    }
  });
  for (const comp of ["c1", "c2"]) { s.companyId = comp; Object.assign(s, genInvoices(s, addDays(t, 7)).state); }
  // pay most past invoices, extend a few
  s.invoices.forEach((inv, i) => {
    const x = r();
    if (inv.dueDate < t && x < 0.72) {
      const at = new Date(Date.now() - Math.floor(r() * 10) * 864e5).toISOString();
      inv.status = "paid"; inv.paidAt = at;
      s.txns.push({ id: "tx" + i, companyId: inv.companyId, invoiceId: inv.id, ref: `DEMO-TXN-${(70000 + i * 13).toString(36).toUpperCase()}`, method: i % 3 ? "online-demo" : "cash", amount: inv.amount, at });
    } else if (inv.dueDate <= t && x > 0.93) {
      const to = r() < 0.4 ? t : addDays(t, 1 + Math.floor(r() * 6));
      inv.extendedDueDate = to; inv.extensions.push({ at: nowIso(), from: inv.dueDate, to, reason: "Customer travelling — requested more time" });
    }
  });
  const open = s.invoices.find((i) => i.status === "unpaid" && i.companyId === "c1");
  if (open) s.collections.push({ id: "co1", companyId: "c1", invoiceId: open.id, method: "cash", status: "requested", requestedAt: nowIso() });
  for (const comp of ["c1", "c2"]) { s.companyId = comp; Object.assign(s, genJobs(s, t).state); }
  s.audit = ["c1", "c2"].map((c, i) => ({ id: "a" + i, companyId: c, at: nowIso(), action: "Demo seeded", detail: "Deterministic fictional data loaded" }));
  s.companyId = "c1";
  return s;
}

function nid(s: State, p: string) { s.seq += 1; return p + s.seq.toString(36); }
function token() { return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 6)).join(""); }
function log(s: State, action: string, detail: string) { s.audit.unshift({ id: nid(s, "a"), companyId: s.companyId, at: nowIso(), action, detail }); if (s.audit.length > 800) s.audit.length = 800; }

export function genJobs(prev: State, date: string) {
  const s = structuredClone(prev); let created = 0;
  const wd = weekday(date);
  if (wd === 1) return { state: s, created };
  const scope = <T extends { companyId: string }>(a: T[]) => a.filter((x) => x.companyId === s.companyId);
  const custs = scope(s.customers).filter((c) => c.startDate <= date);
  const { out } = dayAssignments(custs, scope(s.buildings), scope(s.staff), wd);
  const existing = new Set(s.jobs.filter((j) => j.date === date).map((j) => j.customerId));
  for (const [cleanerId, list] of out) for (const c of list) {
    if (existing.has(c.id)) continue;
    s.jobs.push({ id: nid(s, "j"), companyId: s.companyId, customerId: c.id, date, cleanerId, status: "scheduled" });
    created++;
  }
  return { state: s, created };
}

export function genInvoices(prev: State, asOf: string) {
  const s = structuredClone(prev); let created = 0;
  const keys = new Set(s.invoices.map((i) => i.customerId + "|" + i.period));
  let n = s.invoices.filter((i) => i.companyId === s.companyId).length;
  const prefix = s.companyId === "c1" ? "MSS" : "DGL";
  for (const c of s.customers) {
    if (c.companyId !== s.companyId || c.status !== "active") continue;
    let guard = 0;
    while (c.nextDueDate <= asOf && guard++ < 12) {
      const key = c.id + "|" + c.nextDueDate;
      if (!keys.has(key)) {
        keys.add(key); n++;
        s.invoices.push({
          id: nid(s, "i"), companyId: s.companyId, number: `${prefix}-${String(n).padStart(5, "0")}`, customerId: c.id,
          period: c.nextDueDate, periodEnd: addDays(addMonths(c.nextDueDate, 1), -1), issueDate: addDays(c.nextDueDate, -7),
          dueDate: c.nextDueDate, extensions: [], amount: c.price, status: "unpaid", payToken: token(),
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
let serverState: State | null = null;
const getServer = () => (serverState ??= seed());
const listeners = new Set<() => void>();
function load(): State {
  if (state) return state;
  if (typeof window === "undefined") return getServer();
  try { const raw = localStorage.getItem(KEY); state = raw ? (JSON.parse(raw) as State) : seed(); } catch { state = seed(); }
  return state;
}
function set(next: State) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { console.warn("Demo storage full — changes kept in memory only"); }
  listeners.forEach((l) => l());
}
export function getState() { return load(); }
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => sel(load()), () => sel(getServer()));
}
export function useScoped() {
  const s = useStore((x) => x);
  const c = s.companyId; const f = <T extends { companyId: string }>(a: T[]) => a.filter((x) => x.companyId === c);
  return { s, company: s.companies.find((x) => x.id === c)!, buildings: f(s.buildings), staff: f(s.staff), customers: f(s.customers), jobs: f(s.jobs), invoices: f(s.invoices), txns: f(s.txns), collections: f(s.collections), audit: f(s.audit) };
}
function mutate(fn: (s: State) => void) { const s = structuredClone(load()); fn(s); set(s); }

type Kind = "buildings" | "staff" | "customers";
type Rec = { id?: string | undefined; name?: string; fullName?: string } & Record<string, unknown>;
export const actions = {
  reset() { localStorage.removeItem(KEY); set(seed()); },
  setCompany(id: string) { mutate((s) => { s.companyId = id; }); },
  upsert(kind: Kind, rec: Rec) {
    mutate((s) => {
      const arr = s[kind] as unknown as Rec[];
      const label = rec.name ?? rec.fullName ?? "";
      const noun = kind.replace(/s$/, "");
      if (rec.id) { const i = arr.findIndex((x) => x.id === rec.id); if (i >= 0) arr[i] = { ...arr[i], ...rec }; log(s, `Updated ${noun}`, label); }
      else { arr.push({ ...rec, id: nid(s, kind.slice(0, 1)), companyId: s.companyId }); log(s, `Created ${noun}`, label); }
    });
  },
  remove(kind: Kind, id: string) {
    mutate((s) => {
      const arr = s[kind] as unknown as Rec[];
      const r = arr.find((x) => x.id === id);
      (s as unknown as Record<Kind, Rec[]>)[kind] = arr.filter((x) => x.id !== id);
      log(s, `Deleted ${kind.replace(/s$/, "")}`, r?.name ?? r?.fullName ?? id);
    });
  },
  toggleStaff(id: string) { mutate((s) => { const x = s.staff.find((y) => y.id === id); if (!x) return; x.active = !x.active; log(s, "Staff status", `${x.name} → ${x.active ? "active" : "inactive"}`); }); },
  generateJobs(date: string) { const r = genJobs(load(), date); if (r.created) log(r.state, "Generated jobs", `${r.created} job(s) for ${fmtDate(date)}`); set(r.state); return r.created; },
  setJob(id: string, status: JobStatus, reason?: string) {
    mutate((s) => { const j = s.jobs.find((x) => x.id === id); if (!j) return; j.status = status; j.reason = reason; j.at = status === "scheduled" ? undefined : nowIso();
      const c = s.customers.find((x) => x.id === j.customerId); log(s, `Job ${status}`, `${c?.plate ?? ""} ${fmtDate(j.date)}${reason ? " — " + reason : ""}`); });
  },
  generateInvoices(asOf: string) { const r = genInvoices(load(), asOf); log(r.state, "Generated invoices", `${r.created} new invoice(s) up to ${fmtDate(asOf)}`); set(r.state); return r.created; },
  extendDue(invoiceId: string, to: string, reason: string): string | null {
    const inv0 = load().invoices.find((x) => x.id === invoiceId);
    if (!inv0) return "Invoice not found";
    if (inv0.status === "paid") return "Invoice already paid";
    if (!reason.trim()) return "A reason is required";
    if (to < dubaiToday()) return "New date cannot be in the past";
    if (to === effectiveDue(inv0)) return "Pick a different date";
    mutate((s) => {
      const inv = s.invoices.find((x) => x.id === invoiceId)!;
      inv.extensions.push({ at: nowIso(), from: effectiveDue(inv), to, reason: reason.trim() });
      inv.extendedDueDate = to;
      log(s, "Due date extended", `${inv.number}: ${fmtDate(inv.dueDate)} (original) → ${fmtDate(to)} — ${reason.trim()}`);
    });
    return null;
  },
  rescheduleCustomerDue(customerId: string, to: string, reason: string): string | null {
    if (!reason.trim()) return "A reason is required";
    mutate((s) => { const c = s.customers.find((x) => x.id === customerId); if (!c) return; const from = c.nextDueDate; c.nextDueDate = to;
      log(s, "Monthly due date rescheduled", `${c.fullName}: ${fmtDate(from)} → ${fmtDate(to)} — ${reason.trim()}`); });
    return null;
  },
  simulatePayment(invoiceId: string): string | null {
    let ref: string | null = null;
    mutate((s) => {
      const inv = s.invoices.find((x) => x.id === invoiceId); if (!inv || inv.status === "paid") return;
      const r = `DEMO-TXN-${Date.now().toString(36).toUpperCase()}-${token().slice(0, 4).toUpperCase()}`; ref = r;
      const at = nowIso(); inv.status = "paid"; inv.paidAt = at;
      s.txns.unshift({ id: nid(s, "t"), companyId: inv.companyId, invoiceId, ref: r, method: "online-demo", amount: inv.amount, at });
      s.collections = s.collections.filter((c) => !(c.invoiceId === invoiceId && c.status !== "reconciled"));
      log(s, "Demo payment simulated", `${inv.number} ${aed(inv.amount)} ref ${r}`);
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
    mutate((s) => { const c = s.collections.find((x) => x.id === id); if (!c || c.status !== "requested") return; c.status = "collected"; c.collectedAt = nowIso(); c.collectedBy = staffId;
      const inv = s.invoices.find((x) => x.id === c.invoiceId); log(s, "Marked collected (supervisor)", `${inv?.number} by ${s.staff.find((x) => x.id === staffId)?.name}`); });
  },
  reconcile(id: string) {
    mutate((s) => { const c = s.collections.find((x) => x.id === id); if (!c || c.status !== "collected") return; const inv = s.invoices.find((x) => x.id === c.invoiceId); if (!inv) return;
      const at = nowIso(); c.status = "reconciled"; c.reconciledAt = at;
      if (inv.status !== "paid") { inv.status = "paid"; inv.paidAt = at;
        s.txns.unshift({ id: nid(s, "t"), companyId: inv.companyId, invoiceId: inv.id, ref: `DEMO-${c.method === "cash" ? "CASH" : "TAP"}-${Date.now().toString(36).toUpperCase()}`, method: c.method, amount: inv.amount, at }); }
      log(s, "Admin reconciled collection", `${inv.number} settled (${c.method})`); });
  },
};