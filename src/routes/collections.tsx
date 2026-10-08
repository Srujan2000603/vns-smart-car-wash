import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/kit";
import { CollectionsTable } from "@/components/CollectionsTable";
import { useScoped } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/collections")({ head: meta("Collections", "Cash and card-tap collection requests."), component: () => {
  const { collections } = useScoped();
  return (<><PageHeader title="Collections" desc="Supervisor marks collected, then admin reconciles to settle the invoice." /><CollectionsTable rows={collections} admin /></>);
} });