import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Field, Modal, PageHeader, Pill, Table, td } from "@/components/kit";
import { actions, useScoped, type Staff } from "@/lib/store";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/staff")({ head: meta("Staff", "Cleaners and supervisors with customer assignments."), component: StaffPage });

type Form = Omit<Staff, "companyId" | "id"> & { id?: string };
const blank: Form = { name: "", role: "cleaner", phone: "", active: true };

function StaffPage() {
  const { staff, customers } = useScoped();
  const [form, setForm] = useState<Form | null>(null);
  const [err, setErr] = useState("");
  const [role, setRole] = useState("all");
  const list = staff.filter((s) => role === "all" || s.role === role);
  const assigned = (s: Staff) => customers.filter((c) => (s.role === "cleaner" ? c.cleanerId : c.supervisorId) === s.id);
  const save = () => {
    if (!form) return;
    if (!form.name.trim() || !form.phone.trim()) return setErr("Name and phone are required.");
    actions.upsert("staff", form); toast.success("Staff saved"); setForm(null);
  };
  return (
    <>
      <PageHeader title="Staff" desc="Assign cleaners and supervisors to customers from the Customers page.">
        <select aria-label="Filter by role" className="field w-auto" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">All roles</option><option value="cleaner">Cleaners</option><option value="supervisor">Supervisors</option>
        </select>
        <Button onClick={() => { setErr(""); setForm(blank); }}><Plus className="h-4 w-4" /> Add staff</Button>
      </PageHeader>
      <Table head={["Name", "Role", "Phone", "Assigned customers", "Active", ""]} empty={!list.length}>
        {list.map((s) => {
          const a = assigned(s);
          return (
            <tr key={s.id}>
              <td className={td + " font-medium"}>{s.name}</td><td className={td}><Pill v={s.role} /></td><td className={td}>{s.phone}</td>
              <td className={td}><span className="font-semibold">{a.length}</span> <span className="text-xs text-muted-foreground">{a.slice(0, 3).map((c) => c.plate).join(", ")}{a.length > 3 ? "…" : ""}</span></td>
              <td className={td}><Switch checked={s.active} aria-label={`Toggle ${s.name} active`} onCheckedChange={() => actions.toggleStaff(s.id)} /></td>
              <td className={td + " text-right"}>
                <Button size="icon" variant="ghost" aria-label={`Edit ${s.name}`} onClick={() => { setErr(""); setForm(s); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label={`Delete ${s.name}`} onClick={() => {
                  if (a.length) return toast.error(`Reassign ${a.length} customer(s) first.`);
                  if (confirm(`Delete ${s.name}?`)) { actions.remove("staff", s.id); toast.success("Staff deleted"); }
                }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </td>
            </tr>
          );
        })}
      </Table>
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Edit staff" : "Add staff"}>
        {form && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name"><input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Phone"><input className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+971 5x xxx xxxx" /></Field>
            <Field label="Role"><select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Staff["role"] })}><option value="cleaner">Cleaner</option><option value="supervisor">Supervisor</option></select></Field>
            {err && <p role="alert" className="text-sm text-destructive sm:col-span-2">{err}</p>}
            <div className="flex justify-end gap-2 sm:col-span-2"><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save}>Save</Button></div>
          </div>
        )}
      </Modal>
    </>
  );
}