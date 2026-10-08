import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/kit";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/settings")({ head: meta("Settings & Integrations", "Integration setup guide."), component: () => (
  <>
    <PageHeader title="Settings & integrations" desc="Nothing is connected. This demo never sends notifications or moves money." />
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title="Telegram bot — Not connected">
        <ol className="list-decimal space-y-1 pl-5 text-sm"><li>Open @BotFather in Telegram and run /newbot.</li><li>Copy the bot token.</li><li>Later, store it as a server secret (never in the browser).</li><li>Staff would then receive job and collection alerts.</li></ol>
      </Panel>
      <Panel title="Stripe (TEST mode) — Not connected">
        <p className="text-sm">No key needed now. Online checkout is a simulator only. A future setup would use Stripe test mode first, then live keys after verification. No bank settlement occurs in this demo.</p>
      </Panel>
    </div>
  </>
) });