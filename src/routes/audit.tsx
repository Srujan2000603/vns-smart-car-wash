import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Table, td } from "@/components/kit";
import { fmtDateTime, useScoped } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/audit")({ head: meta("Audit Log", "History of key changes."), component: () => {
  const { audit } = useScoped();
  return (<><PageHeader title="Audit log" />
    <Table head={["When", "Action", "Detail"]} empty={!audit.length}>
      {audit.map((a) => <tr key={a.id}><td className={td + " whitespace-nowrap"}>{fmtDateTime(a.at)}</td><td className={td + " font-medium"}>{a.action}</td><td className={td}>{a.detail}</td></tr>)}
    </Table></>);
} });