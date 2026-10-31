"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { confirmWorkspaceAnswer, submitAssessment } from "@/actions/workspace-actions";
import { AiAlert, Badge, Chips, FreshChip, ProgressBar, StatusChip } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/toast/toast-provider";
import { fmtDate } from "@/lib/format";
import { reqStatus } from "@/lib/status";
import type { ClientRequest, EvidenceItem, Question, TrustAnswer } from "@/lib/types";

type Answer = { value: string | null; confirmed: boolean };
type AnswerStatus = "confirmed" | "suggested" | "blank";

const STEPS = ["Overview", "Questionnaire", "Evidence", "Review & submit"];

function statusOf(a: Answer): AnswerStatus {
  if (a.confirmed) return "confirmed";
  if (a.value) return "suggested";
  return "blank";
}

export function Workspace({
  request: r,
  initialAnswers,
  questions,
  trustAnswers,
  evidence,
}: {
  request: ClientRequest;
  initialAnswers: Record<string, Answer>;
  questions: Question[];
  trustAnswers: TrustAnswer[];
  evidence: EvidenceItem[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, Answer>>(() => {
    const a: Record<string, Answer> = {};
    for (const q of questions) a[q.id] = initialAnswers[q.id] ?? { value: q.defaultValue, confirmed: false };
    return a;
  });
  const [pending, startTransition] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);
  const submitted = r.status === "Submitted";

  const goStep = (n: number) => {
    setStep(n);
    topRef.current?.closest("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const setValue = (qid: string, value: string) => setAnswers((p) => ({ ...p, [qid]: { ...p[qid]!, value } }));
  const evidenceMatch = (type: string) => evidence.find((e) => e.type === type);

  function confirm(qid: string) {
    const value = answers[qid]?.value ?? "";
    if (!value.trim()) return showToast("Add an answer before confirming", "danger");
    startTransition(async () => {
      const res = await confirmWorkspaceAnswer(r.id, qid, value);
      if (!res.ok) return showToast(res.error, "danger");
      setAnswers((p) => ({ ...p, [qid]: { value, confirmed: true } }));
    });
  }

  function submit() {
    startTransition(async () => {
      const res = await submitAssessment(r.id);
      if (!res.ok) return showToast(res.error, "danger");
      showToast("Assessment submitted");
      router.refresh();
    });
  }

  /* ---------- step 1 ---------- */
  const matched = r.reqEvidence.filter((t) => evidenceMatch(t)?.freshness === "fresh").length;
  const overview = (
    <div className="row wrap">
      <div className="col sv-card" style={{ flex: 2, minWidth: 340 }}>
        <div className="sv-card__eyebrow">Request details</div>
        <div className="grid g2">
          <div>
            <div className="sv-caption" style={{ marginBottom: 4 }}>
              Requested by
            </div>
            <div className="sv-body-sm">{r.contact}</div>
          </div>
          <div>
            <div className="sv-caption" style={{ marginBottom: 4 }}>
              Assessment type
            </div>
            <div className="sv-body-sm">{r.kind}</div>
          </div>
          <div>
            <div className="sv-caption" style={{ marginBottom: 4 }}>
              Due date
            </div>
            <div className="sv-body-sm">{fmtDate(r.due)}</div>
          </div>
          <div>
            <div className="sv-caption" style={{ marginBottom: 4 }}>
              Frameworks in scope
            </div>
            <div>
              <Chips items={r.frameworks} />
            </div>
          </div>
        </div>
        <div className="sv-card__footer">
          <button className="sv-btn sv-btn--primary" onClick={() => goStep(2)} style={{ marginLeft: "auto" }}>
            Continue to questionnaire
          </button>
        </div>
      </div>
      <div className="col stack" style={{ minWidth: 250 }}>
        <AiAlert title="Trust Pack readiness">
          <b>
            {r.qDone} of {r.qTotal}
          </b>{" "}
          questions and{" "}
          <b>
            {matched} of {r.reqEvidence.length}
          </b>{" "}
          evidence items can be pre-filled. You confirm every item before it counts.
        </AiAlert>
      </div>
    </div>
  );

  /* ---------- step 2 ---------- */
  const confirmedNow = questions.filter((q) => answers[q.id]?.confirmed).length;
  const notInPack = questions.filter((q) => !q.inTrustPack).length;
  const questionnaire = (
    <>
      <div className="between" style={{ marginBottom: "var(--sv-space-4)" }}>
        <ProgressBar pct={questions.length ? Math.round((confirmedNow / questions.length) * 100) : 0} style={{ flex: 1, marginRight: "var(--sv-space-4)" }} />
        <span className="sv-figure" style={{ color: "var(--sv-brand-text)" }}>
          {confirmedNow} / {questions.length} confirmed
        </span>
      </div>
      <div className="row wrap">
        <div className="col" style={{ flex: 2, minWidth: 360 }}>
          <div className="stack">
            {questions.map((q) => {
              const a = answers[q.id]!;
              const st = statusOf(a);
              const locked = st === "confirmed" || submitted;
              const source = q.sourceAnswerId ? trustAnswers.find((x) => x.id === q.sourceAnswerId) : null;
              return (
                <div className="sv-card" key={q.id}>
                  <div className="between">
                    <span className="sv-code">{q.control}</span>
                    <div style={{ display: "flex", gap: "var(--sv-space-2)" }}>
                      {q.inTrustPack ? (
                        <Badge tone="brand" icon="shield">
                          From Trust Pack
                        </Badge>
                      ) : (
                        <Badge tone="neutral">Not in Trust Pack</Badge>
                      )}
                      {st === "confirmed" ? (
                        <Badge tone="success" icon="checkCircle">
                          Confirmed
                        </Badge>
                      ) : st === "suggested" ? (
                        <Badge tone="warning" icon="clock">
                          Not yet confirmed
                        </Badge>
                      ) : (
                        <Badge tone="brand" icon="pencil">
                          Needs your input
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{q.text}</div>
                  {q.type === "choice" ? (
                    <div style={{ display: "flex", gap: "var(--sv-space-2)", flexWrap: "wrap" }}>
                      {q.options.map((o) => {
                        const sel = a.value === o;
                        return (
                          <button
                            key={o}
                            className={`sv-btn ${sel ? "sv-btn--primary" : "sv-btn--secondary"} sv-btn--sm`}
                            disabled={locked}
                            onClick={() => setValue(q.id, o)}
                          >
                            {sel && <Icon name="check" size={13} />}
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <textarea
                      className="sv-field__input"
                      placeholder={st === "blank" ? "Type your answer" : ""}
                      disabled={locked}
                      value={a.value ?? ""}
                      onChange={(e) => setValue(q.id, e.target.value)}
                    />
                  )}
                  {source && st !== "blank" && q.type === "choice" && (
                    <div className="sv-body-sm" style={{ marginTop: "var(--sv-space-1)" }}>
                      <b style={{ color: "var(--sv-ink)" }}>On file in Trust Pack:</b> {source.a}
                    </div>
                  )}
                  {!locked && (
                    <div style={{ marginTop: "var(--sv-space-1)" }}>
                      <button className="sv-btn sv-btn--secondary sv-btn--sm" disabled={pending} onClick={() => confirm(q.id)}>
                        Confirm this answer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="sv-dropzone" style={{ marginTop: "var(--sv-space-3)" }}>
            + {Math.max(r.qTotal - questions.length, 0)} more questions, grouped by control
          </div>
          <div className="sv-card__footer" style={{ borderTop: 0, paddingTop: "var(--sv-space-4)" }}>
            <button className="sv-btn sv-btn--secondary" onClick={() => goStep(1)}>
              Overview
            </button>
            <button className="sv-btn sv-btn--primary" onClick={() => goStep(3)} style={{ marginLeft: "auto" }}>
              Continue to evidence
            </button>
          </div>
        </div>
        <div className="col stack" style={{ minWidth: 250 }}>
          <AiAlert title="Drafted from Trust Pack">
            Answers you&apos;ve confirmed before are suggested automatically.
            {notInPack > 0 &&
              ` ${notInPack} of these ${questions.length} aren't in your Trust Pack yet, so you'll answer them directly; they're saved to this request only, not added to your Trust Pack.`}
          </AiAlert>
        </div>
      </div>
    </>
  );

  /* ---------- step 3 ---------- */
  const evidenceStep = (
    <>
      <div className="row wrap">
        <div className="col" style={{ flex: 2, minWidth: 360 }}>
          <div className="sv-table__scroll">
            <table className="sv-table">
              <caption>Required evidence for this request</caption>
              <thead>
                <tr>
                  <th>Document type</th>
                  <th>Status</th>
                  <th>Freshness</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {r.reqEvidence.map((t) => {
                  const e = evidenceMatch(t);
                  return (
                    <tr key={t}>
                      <td style={{ fontWeight: 600 }}>{t}</td>
                      <td>
                        {e?.freshness === "fresh" ? (
                          <Badge tone="success" icon="checkCircle">
                            Matched from Trust Pack
                          </Badge>
                        ) : e?.freshness === "expiring" ? (
                          <Badge tone="warning" icon="clock">
                            Needs refresh
                          </Badge>
                        ) : (
                          <Badge tone="danger" icon="alertOctagon">
                            Needs upload
                          </Badge>
                        )}
                      </td>
                      <td>{e ? <FreshChip value={e.freshness} /> : <span className="sv-badge sv-badge--neutral">—</span>}</td>
                      <td>
                        {e?.freshness === "fresh" ? (
                          <Link className="sv-btn sv-btn--tertiary sv-btn--sm" href="/evidence">
                            Replace
                          </Link>
                        ) : e ? (
                          <Link className="sv-btn sv-btn--tertiary sv-btn--sm" href="/evidence">
                            Refresh in Trust Pack
                          </Link>
                        ) : (
                          <Link className="sv-dropzone" style={{ padding: "var(--sv-space-2)", textDecoration: "none" }} href="/evidence">
                            <Icon name="upload" size={16} />
                            Add to Trust Pack
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col stack" style={{ minWidth: 270 }}>
          <AiAlert title="Evidence matching">
            Anything already fresh in your Trust Pack is attached automatically — you only need to handle gaps and refreshes.
          </AiAlert>
        </div>
      </div>
      <div className="sv-card__footer" style={{ borderTop: 0, paddingTop: "var(--sv-space-5)" }}>
        <button className="sv-btn sv-btn--secondary" onClick={() => goStep(2)}>
          Questionnaire
        </button>
        <button className="sv-btn sv-btn--primary" onClick={() => goStep(4)} style={{ marginLeft: "auto" }}>
          Continue to review
        </button>
      </div>
    </>
  );

  /* ---------- step 4 ---------- */
  const qComplete = r.qDone === r.qTotal;
  const eComplete = r.evDone === r.evTotal;
  const review = submitted ? (
    <div className="sv-card">
      <div className="sv-idone">
        <div className="sv-tick">
          <Icon name="checkCircle" size={26} />
        </div>
        <div className="sv-h3" style={{ margin: "var(--sv-space-3) 0 var(--sv-space-1)" }}>
          Assessment submitted
        </div>
        <div className="sv-body" style={{ margin: "0 auto", maxWidth: "54ch" }}>
          Your responses and evidence have been sent back to the requester. You&apos;ll be notified when they review it.
        </div>
        <div style={{ marginTop: "var(--sv-space-5)" }}>
          <Link className="sv-btn sv-btn--primary" href="/requests">
            Back to requests
          </Link>
        </div>
      </div>
    </div>
  ) : (
    <div className="row wrap">
      <div className="col sv-card" style={{ flex: 2, minWidth: 360 }}>
        <div className="between">
          <span className="sv-label">Questionnaire</span>
          <Badge tone={qComplete ? "success" : "brand"} icon={qComplete ? "checkCircle" : "clock"}>
            {r.qDone} / {r.qTotal} answered
          </Badge>
        </div>
        <div className="between">
          <span className="sv-label">Evidence</span>
          {eComplete ? (
            <Badge tone="success" icon="checkCircle">
              {r.evDone} / {r.evTotal} attached
            </Badge>
          ) : (
            <Badge tone="warning" icon="alertTriangle">
              {r.evDone} / {r.evTotal} · gaps remain
            </Badge>
          )}
        </div>
        <div className="sv-card__footer">
          <div className="sv-body-sm" style={{ margin: 0 }}>
            Submitting sends your responses and Trust Pack items back to the requester for review.
          </div>
        </div>
        <div className="between">
          <button className="sv-btn sv-btn--secondary" onClick={() => goStep(3)}>
            Resolve items
          </button>
          <button className="sv-btn sv-btn--primary" onClick={submit} disabled={pending}>
            Submit assessment
          </button>
        </div>
      </div>
      <div className="col sv-card" style={{ minWidth: 250 }}>
        <div className="sv-card__eyebrow">What happens next</div>
        <ol className="sv-body-sm" style={{ paddingLeft: 18, lineHeight: 1.9, margin: 0 }}>
          <li>Reviewer&apos;s AI pre-validates your evidence</li>
          <li>Reviewer accepts or requests changes</li>
          <li>You&apos;re notified of any gaps</li>
          <li>Trust Pack stays reusable for next time</li>
        </ol>
      </div>
    </div>
  );

  return (
    <div className="sv-page" ref={topRef}>
      <Link className="sv-btn sv-btn--tertiary sv-btn--sm" href="/requests" style={{ marginBottom: "var(--sv-space-3)" }}>
        <Icon name="chevronLeft" size={14} />
        Back to requests
      </Link>
      <div className="head">
        <div>
          <h1 className="sv-h1">{r.client}</h1>
          <p className="sv-body">
            {r.kind} · <Chips items={r.frameworks} />
          </p>
        </div>
        <div>
          <StatusChip value={reqStatus(r)} />
        </div>
      </div>
      <div className="sv-stepper">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const cls = n < step ? "is-done" : n === step ? "is-current" : "";
          return (
            <div
              key={label}
              className={`sv-step ${cls}`}
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
              onClick={() => goStep(n)}
              onKeyDown={(e) => e.key === "Enter" && goStep(n)}
            >
              <span className="sv-step__n">{n < step ? <Icon name="checkCircle" size={16} /> : n}</span>
              <span className="sv-step__t">{label}</span>
            </div>
          );
        })}
      </div>
      {step === 1 ? overview : step === 2 ? questionnaire : step === 3 ? evidenceStep : review}
    </div>
  );
}
