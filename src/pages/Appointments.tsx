import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { CalendarClock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '../components/layout/Layout';
import { osAppointments, osLeads } from '../data/roadrunnerOSDemo';
import { bookAppointment, buildShowProbabilityScores } from '../services/roadrunnerOS';
import type { AppointmentRecord, LocationCode } from '../types/roadrunnerOS';

export default function Appointments() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>(osAppointments);
  const [leadId, setLeadId] = useState(osLeads[0]?.id ?? '');
  const [location, setLocation] = useState<LocationCode>('wayne');
  const [vehicleLabel, setVehicleLabel] = useState('2020 Honda Accord Sport');
  const [startsAt, setStartsAt] = useState(() => new Date(Date.now() + 24 * 3_600_000).toISOString().slice(0, 16));
  const [submitting, setSubmitting] = useState(false);

  const leadsById = useMemo(() => new Map(osLeads.map((lead) => [lead.id, lead])), []);
  const showScores = useMemo(() => new Map(buildShowProbabilityScores(appointments).map((row) => [row.appointment_id, row])), [appointments]);

  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [appointments],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!leadId.trim() || !vehicleLabel.trim()) {
      toast.error('Lead and vehicle are required.');
      return;
    }

    setSubmitting(true);
    try {
      const booked = await bookAppointment({
        lead_id: leadId,
        location,
        vehicle_label: vehicleLabel,
        starts_at: new Date(startsAt).toISOString(),
      });
      setAppointments((current) => [...current, booked]);
      toast.success('Appointment booked. T-24h and T-2h reminder flows can now run.');
    } catch (error) {
      toast.error('Could not book appointment.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout variant="command-center" hideTopBar>
      <div className="space-y-5 px-5 pb-8 pt-5 sm:px-6 lg:px-8 xl:px-10">
        <section className="rounded-2xl border border-[#2A3B64] bg-[linear-gradient(180deg,#0F1A37_0%,#0A132A_100%)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#90A5D0]">Appointment OS</p>
          <h1 className="mt-1 text-3xl font-semibold text-[#ECF2FF]">Test-Drive Scheduler</h1>
          <p className="mt-2 text-sm text-[#9EB0D4]">
            Location-aware booking with readiness scoring and no-show visibility.
          </p>
        </section>

        <section className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-4">
            <h2 className="text-lg font-semibold text-[#EAF0FF]">Book New Appointment</h2>
            <div className="mt-4 space-y-3">
              <Field label="Lead">
                <select
                  value={leadId}
                  onChange={(event) => setLeadId(event.target.value)}
                  className="w-full rounded-lg border border-[#325289] bg-[#101B36] px-3 py-2 text-sm text-[#ECF2FF]"
                >
                  {osLeads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.first_name} {lead.last_name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Location">
                <select
                  value={location}
                  onChange={(event) => setLocation(event.target.value as LocationCode)}
                  className="w-full rounded-lg border border-[#325289] bg-[#101B36] px-3 py-2 text-sm text-[#ECF2FF]"
                >
                  <option value="wayne">Wayne</option>
                  <option value="taylor">Taylor</option>
                </select>
              </Field>

              <Field label="Vehicle">
                <input
                  value={vehicleLabel}
                  onChange={(event) => setVehicleLabel(event.target.value)}
                  className="w-full rounded-lg border border-[#325289] bg-[#101B36] px-3 py-2 text-sm text-[#ECF2FF]"
                />
              </Field>

              <Field label="Start">
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  className="w-full rounded-lg border border-[#325289] bg-[#101B36] px-3 py-2 text-sm text-[#ECF2FF]"
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full rounded-xl border border-[#5C7FD2] bg-[#2A4BA8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3559BE] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Booking…' : 'Book Appointment'}
            </button>
          </form>

          <div className="rounded-2xl border border-[#273B63] bg-[#0D172F] p-4">
            <h2 className="text-lg font-semibold text-[#EAF0FF]">Upcoming and Recent</h2>
            <div className="mt-3 space-y-3">
              {sortedAppointments.map((appointment) => {
                const lead = leadsById.get(appointment.lead_id);
                const score = showScores.get(appointment.id);
                return (
                  <article
                    key={appointment.id}
                    className="rounded-xl border border-[#2C446F] bg-[linear-gradient(180deg,#142347_0%,#0E1A37_100%)] p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#EAF0FF]">
                        {lead ? `${lead.first_name} ${lead.last_name}` : appointment.lead_id}
                      </p>
                      <StatusPill status={appointment.status} />
                    </div>
                    <p className="mt-1 text-xs text-[#8EA5D3]">{appointment.vehicle_label}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#94ACD6]">
                      <MapPin size={12} />
                      {appointment.location.toUpperCase()}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#94ACD6]">
                      <CalendarClock size={12} />
                      {new Date(appointment.starts_at).toLocaleString()}
                    </p>
                    {score ? (
                      <p className="mt-2 text-xs text-[#C7D6F5]">
                        Show probability: <span className="font-semibold">{score.score}%</span>
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[#90A6D2]">{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ status }: { status: AppointmentRecord['status'] }) {
  const styles: Record<AppointmentRecord['status'], string> = {
    booked: 'border-[#4D6CB8] bg-[#1D3263] text-[#BDD0FF]',
    confirmed: 'border-[#4A7CAF] bg-[#173757] text-[#BFE3FF]',
    showed: 'border-[#4B9A7B] bg-[#1B4537] text-[#C1F1DD]',
    no_show: 'border-[#935E8A] bg-[#41223C] text-[#F3C6EC]',
    rescheduled: 'border-[#8480B0] bg-[#2C2952] text-[#D1CDFD]',
    cancelled: 'border-[#8E6B6B] bg-[#3D2626] text-[#E9CACA]',
  };

  return <span className={`rounded-full border px-2 py-1 text-[11px] uppercase ${styles[status]}`}>{status.replace('_', ' ')}</span>;
}
