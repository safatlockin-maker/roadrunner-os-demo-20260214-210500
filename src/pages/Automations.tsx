import { useMemo, useState } from 'react';
import { Play, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '../components/layout/Layout';
import { osLeads, osWorkflowDefinitions, osWorkflowRuns } from '../data/roadrunnerOSDemo';
import { executeWorkflow } from '../services/roadrunnerOS';
import type { WorkflowDefinition, WorkflowRun } from '../types/roadrunnerOS';

export default function Automations() {
  const [definitions] = useState<WorkflowDefinition[]>(osWorkflowDefinitions);
  const [runs, setRuns] = useState<WorkflowRun[]>(osWorkflowRuns);
  const [executingKey, setExecutingKey] = useState<string | null>(null);

  const leadsById = useMemo(() => new Map(osLeads.map((lead) => [lead.id, `${lead.first_name} ${lead.last_name}`])), []);

  async function runWorkflow(workflowKey: string) {
    setExecutingKey(workflowKey);
    try {
      const lead = osLeads.find((candidate) => candidate.status !== 'closed_won' && candidate.status !== 'closed_lost');
      const run = await executeWorkflow({
        workflow_key: workflowKey,
        lead_id: lead?.id,
        context: { source: 'manual_run' },
      });
      setRuns((current) => [run, ...current]);
      toast.success(`Workflow ${workflowKey} queued.`);
    } catch (error) {
      toast.error('Failed to execute workflow.');
      console.error(error);
    } finally {
      setExecutingKey(null);
    }
  }

  return (
    <Layout variant="command-center" hideTopBar>
      <div className="space-y-5 px-5 pb-8 pt-5 sm:px-6 lg:px-8 xl:px-10">
        <section className="rounded-2xl border border-[#2A3B64] bg-[linear-gradient(180deg,#0F1A37_0%,#0A132A_100%)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#90A5D0]">Automations</p>
          <h1 className="mt-1 text-3xl font-semibold text-[#ECF2FF]">Workflow Engine</h1>
          <p className="mt-2 text-sm text-[#9EB0D4]">
            Event-driven flows for new leads, missed calls, finance rescue, and stale lead reactivation.
          </p>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-4">
            <h2 className="text-lg font-semibold text-[#EAF0FF]">Workflow Recipes</h2>
            <div className="mt-3 space-y-3">
              {definitions.map((workflow) => (
                <article
                  key={workflow.id}
                  className="rounded-xl border border-[#2B426F] bg-[linear-gradient(180deg,#142347_0%,#0E1A37_100%)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2">
                      <Workflow size={16} className="text-[#9CB6E8]" />
                      <p className="text-sm font-semibold text-[#EAF0FF]">{workflow.name}</p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] uppercase ${
                        workflow.is_active
                          ? 'border-[#4B9A7B] bg-[#1B4537] text-[#C1F1DD]'
                          : 'border-[#8E6B6B] bg-[#3D2626] text-[#E9CACA]'
                      }`}
                    >
                      {workflow.is_active ? 'active' : 'paused'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#8CA4D2]">Trigger: {workflow.trigger}</p>
                  <p className="mt-1 text-xs text-[#8CA4D2]">{workflow.action_count} actions</p>
                  <button
                    type="button"
                    onClick={() => runWorkflow(workflow.key)}
                    disabled={executingKey === workflow.key}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#5C7FD2] bg-[#2A4BA8] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3559BE] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Play size={14} />
                    {executingKey === workflow.key ? 'Running…' : 'Run now'}
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-4">
            <h2 className="text-lg font-semibold text-[#EAF0FF]">Recent Workflow Runs</h2>
            <div className="mt-3 space-y-3">
              {runs.length === 0 ? (
                <p className="rounded-xl border border-[#24375C] bg-[#111C38] px-3 py-2 text-sm text-[#8FA6D4]">
                  No runs available.
                </p>
              ) : (
                runs.map((run) => (
                  <article
                    key={run.id}
                    className="rounded-xl border border-[#2B426F] bg-[linear-gradient(180deg,#142347_0%,#0E1A37_100%)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#EAF0FF]">{run.workflow_key}</p>
                      <RunStatus status={run.status} />
                    </div>
                    <p className="mt-1 text-xs text-[#8CA4D2]">{new Date(run.created_at).toLocaleString()}</p>
                    {run.lead_id ? (
                      <p className="mt-1 text-xs text-[#8CA4D2]">Lead: {leadsById.get(run.lead_id) ?? run.lead_id}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-[#DDE7FA]">{run.detail}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function RunStatus({ status }: { status: WorkflowRun['status'] }) {
  const styleByStatus: Record<WorkflowRun['status'], string> = {
    queued: 'border-[#6B7EA8] bg-[#27395B] text-[#CDDAF5]',
    running: 'border-[#5D86D1] bg-[#203A72] text-[#C9DBFF]',
    completed: 'border-[#4B9A7B] bg-[#1B4537] text-[#C1F1DD]',
    failed: 'border-[#935E8A] bg-[#41223C] text-[#F3C6EC]',
  };

  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] uppercase ${styleByStatus[status]}`}>
      {status}
    </span>
  );
}
