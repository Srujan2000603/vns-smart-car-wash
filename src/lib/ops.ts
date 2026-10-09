import { useMemo } from "react";
import { CAPACITY, WORK_DAYS, dayAssignments, dubaiToday, addDays, effectiveDue, type Building, type Customer, type Invoice, type Staff } from "@/lib/store";

/** Per-day balanced routes for all workdays, memoised on the scoped arrays. */
export function useWeekPlan(customers: Customer[], buildings: Building[], staff: Staff[]) {
  return useMemo(() => {
    const days = WORK_DAYS.map((d) => ({ day: d, ...dayAssignments(customers, buildings, staff, d) }));
    const cleaners = staff.filter((s) => s.role === "cleaner" && s.active);
    const activeCars = customers.filter((c) => c.status === "active").length;
    const weeklyDemand = days.reduce((a, d) => a + d.due.length, 0);
    const capMin = cleaners.length * WORK_DAYS.length * CAPACITY.min;
    const capMax = cleaners.length * WORK_DAYS.length * CAPACITY.max;
    const overloads = days.flatMap((d) => [...d.out].filter(([, l]) => l.length > CAPACITY.max).map(([id, l]) => ({ day: d.day, id, n: l.length })));
    const underloads = days.flatMap((d) => [...d.out].filter(([, l]) => l.length < CAPACITY.min).map(([id, l]) => ({ day: d.day, id, n: l.length })));
    return { days, cleaners, activeCars, weeklyDemand, capMin, capMax, overloads, underloads };
  }, [customers, buildings, staff]);
}

export type DueBlock = "due-today" | "extended-today" | "overdue" | "upcoming";
export function dueBlock(i: Invoice): DueBlock | null {
  if (i.status === "paid") return null;
  const t = dubaiToday(); const eff = effectiveDue(i);
  if (i.extendedDueDate === t) return "extended-today";
  if (!i.extendedDueDate && i.dueDate === t) return "due-today";
  if (eff < t) return "overdue";
  if (eff <= addDays(t, 7)) return "upcoming";
  return null;
}