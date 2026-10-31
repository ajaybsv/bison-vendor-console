import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Chips, ProgressBar, StatusChip } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";
import { ReminderButton } from "@/components/sent-requests/reminder-button";
import { getVendor, getVendorRequest, listQuestions } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "Sent request — BISON" };

export default async function SentRequestDetailPage({ params }: PageProps<"/sent-requests/[id]">) {
  const { id } = await params;
  const r = await getVendorRequest(Number(id));
  if (!r) notFound();
  const [v, questions] = await Promise.all([getVendor(r.vendorId), listQuestions()]);
  const qPct = r.qTotal ? Math.round((r.qDone / r.qTotal) * 100) : 0;
  const evPct = r.evTotal ? Math.round((r.evDone / r.evTotal) * 100) : 0;
  const asked = questions.filter((q) => r.controlsSent.includes(q.control));

  return (
    <div className="sv-page">
      <Link
        className="sv-btn sv-btn--tertiary sv-btn--sm"
        href={v ? `/vendors/${v.id}` : "/sent-requests"}
        style={{ marginBottom: "var(--sv-space-3)" }}
      >
        <Icon name="chevronLeft" size={14} />
        Back to {v ? v.name : "Sent Requests"}
      </Link>
      <div className="head">
        <div>
          <h1 className="sv-h1">{r.vendorName}</h1>
          <p className="sv-body">
            Sent {fmtDate(r.sentOn)} · <Chips items={r.controlsSent} />
          </p>
        </div>
        <div>
          <StatusChip value={r.status} />
        </div>
      </div>
      <div className="grid g2" style={{ marginBottom: "var(--sv-space-5)" }}>
        <div className="sv-card">
          <div className="sv-card__eyebrow">Questionnaire</div>
          <div className="between" style={{ fontWeight: 600 }}>
            <span>
              {r.qDone} / {r.qTotal} answered
            </span>
            <span className="sv-figure">{qPct}%</span>
          </div>
          <ProgressBar pct={qPct} />
        </div>
        <div className="sv-card">
          <div className="sv-card__eyebrow">Evidence</div>
          <div className="between" style={{ fontWeight: 600 }}>
            <span>
              {r.evDone} / {r.evTotal} received
            </span>
            <span className="sv-figure">{evPct}%</span>
          </div>
          <ProgressBar pct={evPct} />
        </div>
      </div>
      {r.status !== "Completed" && (
        <div className="row" style={{ marginBottom: "var(--sv-space-5)" }}>
          <ReminderButton requestId={r.id} vendorName={r.vendorName} />
        </div>
      )}
      <h2 className="sv-h3" style={{ marginBottom: "var(--sv-space-3)" }}>
        Responses
      </h2>
      <div className="stack" style={{ marginBottom: "var(--sv-space-6)" }}>
        {asked.length === 0 && <div className="sv-body-sm">No questions in this request.</div>}
        {asked.map((q) => {
          const resp = r.responses.find((x) => x.questionId === q.id);
          return (
            <div className="sv-card" key={q.id}>
              <div className="between">
                <span className="sv-code">{q.control}</span>
                {resp?.confirmed ? (
                  <Badge tone="success" icon="checkCircle">
                    Answered
                  </Badge>
                ) : (
                  <Badge tone="warning" icon="clock">
                    Awaiting response
                  </Badge>
                )}
              </div>
              <div style={{ fontWeight: 600 }}>{q.text}</div>
              {resp?.confirmed ? (
                <div className="sv-field__input" style={{ height: "auto", padding: "var(--sv-space-3)", background: "var(--sv-surface-raised)" }}>
                  {resp.value}
                </div>
              ) : (
                <div className="sv-dropzone" style={{ justifyContent: "flex-start", padding: "var(--sv-space-3)" }}>
                  Not yet answered
                </div>
              )}
            </div>
          );
        })}
      </div>
      <h2 className="sv-h3" style={{ marginBottom: "var(--sv-space-3)" }}>
        Evidence
      </h2>
      <div className="sv-table__scroll">
        <table className="sv-table">
          <caption>Documents requested from {r.vendorName}</caption>
          <thead>
            <tr>
              <th>Document type</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {r.evidence.length === 0 ? (
              <tr>
                <td colSpan={3} className="sv-body-sm">
                  No evidence requested.
                </td>
              </tr>
            ) : (
              r.evidence.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 600 }}>{e.type}</td>
                  <td>
                    {e.status === "received" ? (
                      <Badge tone="success" icon="checkCircle">
                        Received
                      </Badge>
                    ) : (
                      <Badge tone="warning" icon="clock">
                        Requested
                      </Badge>
                    )}
                  </td>
                  <td>
                    {e.status === "received" ? (
                      <>
                        <span className="sv-code">{e.fileName}</span>
                        <div className="sv-caption">Received {fmtDate(e.receivedOn)}</div>
                      </>
                    ) : (
                      <span className="sv-caption">Not yet uploaded</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
