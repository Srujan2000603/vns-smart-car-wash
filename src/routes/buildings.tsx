import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Field, Modal, PageHeader, Table, td } from "@/components/kit";
import { actions, useScoped, type Building } from "@/lib/store";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/buildings")({ head: meta("Buildings", "Manage residential buildings and parking."), component: Buildings });

type Form = Omit<Building, "companyId" | "id"> & { id?: string };
const blank: Form = { name: "", area: "", parkingLevels: 1 };

function Buildings() {
  const { buildings, customers } = useScoped();
  const [form, setForm] = useState<Form | null>(null);
  const [err, setErr] = useState("");
  const save = () => {
    if (!form) return;
    if (!form.name.trim() || !form.area.trim()) return setErr("Name and area are required.");
    actions.upsert("buildings", form); toast.success(form.id ? "Building updated" : "Building added"); setForm(null);
  };
  return (
    <>
      <PageHeader title="Buildings" desc="Buildings served by the selected company.">
        <Button onClick={() => { setErr(""); setForm(blank); }}><Plus className="h-4 w-4" /> Add building</Button>
      </PageHeader>
      <Table head={["Name", "Area", "Parking levels", "Customers", ""]} empty={!buildings.length}>
        {buildings.map((b) => {
          const n = customers.filter((c) => c.buildingId === b.id).length;
          return (
            <tr key={b.id}>
              <td className={td + " font-medium"}>{b.name}</td><td className={td}>{b.area}</td><td className={td}>{b.parkingLevels}</td><td className={td}>{n}</td>
              <td className={td + " text-right"}>
                <Button size="icon" variant="ghost" aria-label={`Edit ${b.name}`} onClick={() => { setErr(""); setForm(b); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label={`Delete ${b.name}`} onClick={() => {
                  if (n) return toast.error(`Reassign ${n} customer(s) before deleting this building.`);
                  if (confirm(`Delete ${b.name}?`)) { actions.remove("buildings", b.id); toast.success("Building deleted"); }
                }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </td>
            </tr>
          );
        })}
      </Table>
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Edit building" : "Add building"}>
        {form && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Building name"><input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Area"><input className="field" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></Field>
            <Field label="Parking levels"><input type="number" min={1} max={20} className="field" value={form.parkingLevels} onChange={(e) => setForm({ ...form, parkingLevels: Math.max(1, +e.target.value) })} /></Field>
            {err && <p role="alert" className="text-sm text-destructive sm:col-span-2">{err}</p>}
            <div className="flex justify-end gap-2 sm:col-span-2"><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save}>Save</Button></div>
          </div>
        )}
      </Modal>
    </>
  );
}