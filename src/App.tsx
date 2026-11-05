import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  buildEvidenceReport,
  importEvidenceReport,
  deleteApplication,
  deleteEvidence,
  listApplications,
  listEvidence,
  saveApplication,
  saveEvidence,
  searchRecords,
  updateEvidenceStatus,
  updateFollowUpDate,
  updateApplicationStage,
  type ApplicationInput,
  type EvidenceInput,
} from "./repository";
import { APPLICATION_STAGES, EVIDENCE_STATUSES, type ApplicationRecord, type ApplicationStage, type EvidenceRecord, type EvidenceStatus } from "./types";
import { buildWorkspaceCsv } from "./csv";
import { getApplicationStageMetrics, getEvidenceReadinessMetrics, getStaleApplications } from "./analytics";
import { addCalendarDays } from "./dates";

const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

const emptyApplication: ApplicationInput = { company: "", role: "", jobUrl: "", appliedAt: "", stage: "saved", followUpAt: "", nextStep: "", notes: "" };
const emptyEvidence: EvidenceInput = { applicationId: "", requirement: "", evidenceTitle: "", evidenceUrl: "", contribution: "", context: "", status: "planned" };

function localDate(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatStage(stage: ApplicationStage): string {
  return stage === "saved" ? "Saved" : stage === "applied" ? "Applied" : stage === "assessment" ? "Assessment" : stage === "interview" ? "Interview" : stage === "offer" ? "Offer" : "Rejected";
}

function formatStatus(status: EvidenceStatus): string {
  return status === "in_progress" ? "In progress" : status[0].toUpperCase() + status.slice(1);
}

export default function App() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [allApplications, setAllApplications] = useState<ApplicationRecord[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [allEvidence, setAllEvidence] = useState<EvidenceRecord[]>([]);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | ApplicationStage>("all");
  const [evidenceStatusFilter, setEvidenceStatusFilter] = useState<"all" | EvidenceStatus>("all");
  const [applicationSort, setApplicationSort] = useState<"updated" | "company" | "follow_up" | "stage">("updated");
  const [evidenceSort, setEvidenceSort] = useState<"updated" | "requirement" | "status">("updated");
  const [activeView, setActiveView] = useState<"overview" | "applications" | "evidence">("overview");
  const [applicationForm, setApplicationForm] = useState<ApplicationInput>(emptyApplication);
  const [evidenceForm, setEvidenceForm] = useState<EvidenceInput>(emptyEvidence);
  const [editingApplication, setEditingApplication] = useState<string | undefined>();
  const [editingEvidence, setEditingEvidence] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const refreshSequence = useRef(0);

  async function refresh(search = query) {
    const requestId = ++refreshSequence.current;
    try {
      const [result, allApps, everyEvidence] = await Promise.all([searchRecords(search), listApplications(), listEvidence()]);
      if (requestId !== refreshSequence.current) return;
      setApplications(result.applications);
      setAllApplications(allApps);
      setAllEvidence(everyEvidence);
      setEvidence(result.evidence);
    } catch (reason) {
      // Ignore a failed request if a newer search has already superseded it.
      if (requestId !== refreshSequence.current) return;
      throw reason;
    }
  }

  useEffect(() => {
    let mounted = true;
    const initialRequestId = refreshSequence.current;
    Promise.all([listApplications(), listEvidence()])
      .then(([apps, items]) => {
        if (mounted && initialRequestId === refreshSequence.current) {
          setApplications(apps);
          setAllApplications(apps);
          setAllEvidence(items);
          setEvidence(items);
        }
      })
      .catch(() => {
        if (mounted) setError("Local database could not be opened. Try refreshing this page.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // Invalidate in-flight work as soon as the query changes, not after the debounce.
    refreshSequence.current += 1;
    const timer = window.setTimeout(() => {
      void refresh(query).catch(() => setError("Could not refresh local records. Try reloading the workspace."));
    }, 120);
    return () => window.clearTimeout(timer);
  }, [query]);

  const visibleApplications = useMemo(() => {
    const filtered = stageFilter === "all" ? applications : applications.filter((item) => (item.stage ?? "saved") === stageFilter);
    return [...filtered].sort((a, b) => {
      if (applicationSort === "company") return a.company.localeCompare(b.company) || a.role.localeCompare(b.role);
      if (applicationSort === "stage") return APPLICATION_STAGES.indexOf(a.stage ?? "saved") - APPLICATION_STAGES.indexOf(b.stage ?? "saved");
      if (applicationSort === "follow_up") {
        if (!a.followUpAt) return 1;
        if (!b.followUpAt) return -1;
        return a.followUpAt.localeCompare(b.followUpAt);
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [applications, stageFilter, applicationSort]);
  const visibleEvidence = useMemo(() => {
    const filtered = evidenceStatusFilter === "all" ? evidence : evidence.filter((item) => item.status === evidenceStatusFilter);
    return [...filtered].sort((a, b) => {
      if (evidenceSort === "requirement") return a.requirement.localeCompare(b.requirement);
      if (evidenceSort === "status") return EVIDENCE_STATUSES.indexOf(a.status) - EVIDENCE_STATUSES.indexOf(b.status);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [evidence, evidenceStatusFilter, evidenceSort]);
  const dueFollowUps = useMemo(() => allApplications.filter((item) => item.followUpAt && item.followUpAt <= localDate() && item.stage !== "rejected").sort((a, b) => a.followUpAt.localeCompare(b.followUpAt)), [allApplications]);
  const stageMetrics = useMemo(() => getApplicationStageMetrics(allApplications), [allApplications]);
  const readinessMetrics = useMemo(() => getEvidenceReadinessMetrics(allEvidence), [allEvidence]);
  const staleApplications = useMemo(() => getStaleApplications(allApplications, localDate()), [allApplications]);

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await saveApplication(applicationForm, editingApplication);
      setApplicationForm(emptyApplication);
      setEditingApplication(undefined);
      await refresh();
      setNotice(editingApplication ? "Application updated." : "Application saved locally.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save application.");
    }
  }

  async function submitEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await saveEvidence(evidenceForm, editingEvidence);
      setEvidenceForm(emptyEvidence);
      setEditingEvidence(undefined);
      await refresh();
      setNotice(editingEvidence ? "Evidence updated." : "Evidence saved locally.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save evidence.");
    }
  }

  function editApplication(item: ApplicationRecord) {
    setApplicationForm({
      company: item.company, role: item.role, jobUrl: item.jobUrl,
      appliedAt: item.appliedAt, stage: item.stage ?? "saved", followUpAt: item.followUpAt ?? "", nextStep: item.nextStep, notes: item.notes,
    });
    setEditingApplication(item.id);
    setActiveView("applications");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editEvidence(item: EvidenceRecord) {
    setEvidenceForm({
      applicationId: item.applicationId ?? "", requirement: item.requirement,
      evidenceTitle: item.evidenceTitle, evidenceUrl: item.evidenceUrl,
      contribution: item.contribution, context: item.context, status: item.status,
    });
    setEditingEvidence(item.id);
    setActiveView("evidence");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeApplication(id: string) {
    if (!window.confirm("Delete this application? Its evidence items will be kept but unlinked.")) return;
    try {
      await deleteApplication(id);
      await refresh();
      setNotice("Application deleted. Related evidence was preserved.");
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete application.");
    }
  }

  async function removeEvidence(id: string) {
    if (!window.confirm("Delete this evidence item? This cannot be undone.")) return;
    try {
      await deleteEvidence(id);
      await refresh();
      setNotice("Evidence item deleted.");
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete evidence item.");
    }
  }

  async function changeApplicationStage(id: string, stage: ApplicationStage) {
    try {
      await updateApplicationStage(id, stage);
      await refresh();
      setNotice("Application stage updated.");
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update application stage.");
    }
  }
  async function adjustFollowUp(item: ApplicationRecord, days?: number) {
    try {
      const nextDate = days === undefined ? "" : addCalendarDays(localDate(), days);
      await updateFollowUpDate(item.id, nextDate);
      await refresh();
      setNotice(days === undefined ? "Follow-up marked complete." : `Follow-up moved to ${nextDate}.`);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update this follow-up.");
    }
  }
  async function changeStatus(id: string, status: EvidenceStatus) {
    try {
      await updateEvidenceStatus(id, status);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update status.");
    }
  }

  async function exportReport() {
    try {
      const report = await buildEvidenceReport();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "job-application-evidence-report.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setNotice("Your JSON report has been exported.");
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not export your report.");
    }
  }

  async function exportCsv() {
    try {
      const blob = new Blob([buildWorkspaceCsv(allApplications, allEvidence)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "job-application-evidence.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setNotice("Your CSV export has been downloaded.");
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not export your CSV.");
    }
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("Backup files must be 10 MB or smaller.");
      const parsed: unknown = JSON.parse(await file.text());
      const counts = await importEvidenceReport(parsed);
      setQuery("");
      await refresh("");
      setNotice(`Imported ${counts.applications} applications and ${counts.evidence} evidence items. Matching IDs were updated; other local records were kept.`);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not import this backup file.");
    } finally {
      input.value = "";
    }
  }

  const linkedApplication = (id?: string) => allApplications.find((item) => item.id === id);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={() => setActiveView("overview")}>
          <span className="brand-mark">E</span>
          <span>evidence<span className="brand-light">/planner</span></span>
        </a>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button aria-current={activeView === "overview" ? "page" : undefined} className={activeView === "overview" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("overview")}><span>◫</span> Overview</button>
          <button aria-current={activeView === "applications" ? "page" : undefined} className={activeView === "applications" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("applications")}><span>▤</span> Applications <b>{applications.length}</b></button>
          <button aria-current={activeView === "evidence" ? "page" : undefined} className={activeView === "evidence" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("evidence")}><span>◇</span> Evidence library <b>{evidence.length}</b></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-card"><span className="privacy-dot" /> <div><strong>Private by default</strong><small>Your data stays in this browser.</small></div></div>
          <small className="version-label">DAY 1 · LOCAL WORKSPACE</small>
        </div>
      </aside>

      <section className="main-panel" aria-busy={loading}>
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{activeView === "overview" ? "Overview" : activeView === "applications" ? "Applications" : "Evidence library"}</strong></div>
          <div className="top-actions"><span className="local-indicator"><i /> Local storage active</span><label className="button button-secondary button-small import-label">↑ Import backup<input className="import-input" type="file" accept="application/json,.json" onChange={(event) => void importBackup(event)} /></label><button className="button button-secondary button-small" onClick={() => void exportCsv()}>↓ Export CSV</button><button className="button button-secondary button-small" onClick={() => void exportReport()}>↓ Export JSON</button></div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div><div className="eyebrow">YOUR CAREER WORKSPACE</div><h1>{activeView === "overview" ? "Evidence, organized." : activeView === "applications" ? "Your applications" : "Evidence library"}</h1><p>{activeView === "overview" ? "Connect what a role asks for with the work you have actually done." : activeView === "applications" ? "Keep every opportunity and next step in one place." : "Map role requirements to projects, experience, and real contributions."}</p></div>
            <button className="button button-primary" onClick={() => { setActiveView("applications"); setEditingApplication(undefined); setApplicationForm(emptyApplication); }}>＋ Add application</button>
          </div>

          {error && <div className="alert alert-error" role="alert" aria-live="assertive">{error}<button onClick={() => setError("")}>×</button></div>}
          {notice && <div className="alert alert-success" role="status" aria-live="polite">{notice}<button onClick={() => setNotice("")}>×</button></div>}

          {activeView === "overview" && <>
            <div className="stats-grid">
              <article className="stat-card"><span className="stat-icon violet">▤</span><div className="stat-value">{allApplications.length}</div><div className="stat-label">Applications tracked</div><div className="stat-foot">Opportunities in your workspace</div></article>
              <article className="stat-card"><span className="stat-icon blue">◇</span><div className="stat-value">{allEvidence.length}</div><div className="stat-label">Evidence items</div><div className="stat-foot">Requirements mapped to proof</div></article>
              <article className="stat-card"><span className="stat-icon amber">◷</span><div className="stat-value">{readinessMetrics.inProgress}</div><div className="stat-label">In progress</div><div className="stat-foot">Evidence still being prepared</div></article>
              <article className="stat-card"><span className="stat-icon green">✓</span><div className="stat-value">{readinessMetrics.completed}</div><div className="stat-label">Ready to use</div><div className="stat-foot">Completed evidence items</div></article>
            </div>
            <div className="dashboard-grid">
              <section className="panel-card dashboard-card" aria-labelledby="pipeline-heading">
                <div className="section-heading"><div><h2 id="pipeline-heading">Application pipeline</h2><p>Where each opportunity currently stands.</p></div><span className="count">{allApplications.length} total</span></div>
                {allApplications.length === 0 ? <p className="dashboard-empty">Add an application to see your pipeline distribution.</p> : <div className="pipeline-list">
                  {stageMetrics.map((metric) => <div className="pipeline-row" key={metric.stage}>
                    <div className="pipeline-label"><span>{formatStage(metric.stage)}</span><strong>{metric.count}</strong></div>
                    <div className="pipeline-track" role="progressbar" aria-label={formatStage(metric.stage)} aria-valuemin={0} aria-valuemax={allApplications.length} aria-valuenow={metric.count}><span style={{ width: String(metric.percentage) + "%" }} /></div>
                  </div>)}
                </div>}
              </section>
              <section className="panel-card dashboard-card" aria-labelledby="readiness-heading">
                <div className="section-heading"><div><h2 id="readiness-heading">Evidence readiness</h2><p>How much of your supporting proof is ready.</p></div><span className="count">{readinessMetrics.completionPercentage}% ready</span></div>
                <div className="readiness-summary"><strong>{readinessMetrics.completed} of {allEvidence.length}</strong><span>evidence items completed</span></div>
                <div className="readiness-track" role="progressbar" aria-label="Evidence completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={readinessMetrics.completionPercentage}><span style={{ width: String(readinessMetrics.completionPercentage) + "%" }} /></div>
                <div className="readiness-breakdown">
                  <div><span className="readiness-dot planned-dot" /> Planned <strong>{readinessMetrics.planned}</strong></div>
                  <div><span className="readiness-dot progress-dot" /> In progress <strong>{readinessMetrics.inProgress}</strong></div>
                  <div><span className="readiness-dot completed-dot" /> Completed <strong>{readinessMetrics.completed}</strong></div>
                </div>
                <p className="linked-summary">{readinessMetrics.linked} of {allEvidence.length} evidence items linked to an application ({readinessMetrics.linkedPercentage}%).</p>
              </section>
            </div>
            <div className="section-heading"><div><h2>Recent activity</h2><p>Your latest applications and supporting evidence.</p></div><button className="text-button" onClick={() => setActiveView("evidence")}>View evidence →</button></div>
            <div className="panel-card">
              {loading ? <div className="empty-state">Loading your local workspace…</div> : evidence.length === 0 && applications.length === 0 ? <div className="empty-state"><div className="empty-icon">✳</div><h3>Your workspace starts here</h3><p>Add an application, then connect its requirements to projects and experience you can stand behind.</p><button className="button button-primary" onClick={() => setActiveView("applications")}>Add your first application</button></div> : <div className="activity-list">
                {evidence.slice(0, 5).map((item) => <div className="activity-row" key={item.id}><div className="activity-icon">◇</div><div className="activity-copy"><strong>{item.requirement}</strong><span>{item.evidenceTitle} · {linkedApplication(item.applicationId)?.company ?? "General evidence"}</span></div><StatusPill status={item.status} /></div>)}
                {applications.slice(0, 3).map((item) => <div className="activity-row" key={item.id}><div className="activity-icon application-icon">▤</div><div className="activity-copy"><strong>{item.role}</strong><span>{item.company} · Application</span></div><span className="plain-tag">Tracked</span></div>)}
              </div>}
            </div>
            <section className="panel-card follow-up-panel"><div className="section-heading"><div><h2>Follow-up reminders</h2><p>Dates that need your attention.</p></div><span className="count">{dueFollowUps.length}</span></div>{dueFollowUps.length === 0 ? <p className="follow-up-empty">No follow-ups due today. Add a follow-up date to any tracked role.</p> : <div className="activity-list">{dueFollowUps.slice(0, 5).map((item) => <div className="activity-row" key={item.id}><div className="activity-icon application-icon">◷</div><div className="activity-copy"><strong>{item.company} · {item.role}</strong><span>{item.nextStep || "Follow up on this application"} · {item.followUpAt < localDate() ? "Overdue" : "Due today"}</span></div><div className="follow-up-actions"><button className="text-button" onClick={() => editApplication(item)}>Open</button><button className="text-button" onClick={() => void adjustFollowUp(item, 3)}>+3 days</button><button className="text-button" onClick={() => void adjustFollowUp(item, 7)}>+7 days</button><button className="text-button follow-up-done" onClick={() => void adjustFollowUp(item)}>Done</button></div></div>)}</div>}</section>
            <section className="panel-card follow-up-panel stale-panel">
              <div className="section-heading"><div><h2>Needs a check-in</h2><p>Active opportunities with no update in more than 14 days.</p></div><span className="count">{staleApplications.length}</span></div>
              {staleApplications.length === 0 ? <p className="follow-up-empty">No inactive applications need attention right now.</p> : <div className="activity-list">{staleApplications.slice(0, 5).map(({ application, daysSinceUpdate }) => <div className="activity-row" key={application.id}><div className="activity-icon application-icon">⌛</div><div className="activity-copy"><strong>{application.company} · {application.role}</strong><span>{formatStage(application.stage)} · No update for {daysSinceUpdate} days</span></div><button className="text-button" onClick={() => editApplication(application)}>Review →</button></div>)}</div>}
            </section>
            <div className="privacy-banner"><span>◈</span><div><strong>Your information stays yours.</strong><p>Applications and evidence are stored in this browser using IndexedDB. Nothing is uploaded to a server.</p></div></div>
          </>}

          {activeView === "applications" && <div className="two-column">
            <section className="panel-card form-card"><div className="card-heading"><div><h2>{editingApplication ? "Edit application" : "Add an application"}</h2><p>Capture the opportunity and your next action.</p></div></div>
              <form onSubmit={submitApplication} className="form-stack">
                <label>Company name<input maxLength={200} required value={applicationForm.company} onChange={(e) => setApplicationForm({ ...applicationForm, company: e.target.value })} placeholder="e.g. Acme Technologies" /></label>
                <label>Role title<input maxLength={200} required value={applicationForm.role} onChange={(e) => setApplicationForm({ ...applicationForm, role: e.target.value })} placeholder="e.g. Software Engineer" /></label>
                <label>Job posting URL<input maxLength={2048} type="url" value={applicationForm.jobUrl} onChange={(e) => setApplicationForm({ ...applicationForm, jobUrl: e.target.value })} placeholder="https://…" /></label>
                <label>Application date<input type="date" value={applicationForm.appliedAt} onChange={(e) => setApplicationForm({ ...applicationForm, appliedAt: e.target.value })} /></label>
                <label>Pipeline stage<select value={applicationForm.stage ?? "saved"} onChange={(e) => setApplicationForm({ ...applicationForm, stage: e.target.value as ApplicationStage })}>{APPLICATION_STAGES.map((stage) => <option key={stage} value={stage}>{formatStage(stage)}</option>)}</select></label>
                <label>Follow-up date<input type="date" value={applicationForm.followUpAt ?? ""} onChange={(e) => setApplicationForm({ ...applicationForm, followUpAt: e.target.value })} /></label>
                <label>Next step<input maxLength={500} value={applicationForm.nextStep} onChange={(e) => setApplicationForm({ ...applicationForm, nextStep: e.target.value })} placeholder="e.g. Follow up with recruiter" /></label>
                <label>Private notes<textarea maxLength={10000} rows={3} value={applicationForm.notes} onChange={(e) => setApplicationForm({ ...applicationForm, notes: e.target.value })} placeholder="Anything you want to remember…" /></label>
                <div className="form-actions"><button className="button button-primary" type="submit">{editingApplication ? "Save changes" : "Save application"}</button>{editingApplication && <button className="button button-secondary" type="button" onClick={() => { setEditingApplication(undefined); setApplicationForm(emptyApplication); }}>Cancel</button>}</div>
              </form>
            </section>
            <section className="panel-card list-card"><div className="card-heading"><div><h2>Tracked roles <span className="count">{visibleApplications.length}</span></h2><p>All your opportunities in one view.</p></div></div>
              <SearchBox value={query} onChange={setQuery} />
              <label className="filter-label">Filter by stage<select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as "all" | ApplicationStage)}><option value="all">All stages</option>{APPLICATION_STAGES.map((stage) => <option key={stage} value={stage}>{formatStage(stage)}</option>)}</select></label>
              <label className="filter-label">Sort applications by<select aria-label="Sort applications by" value={applicationSort} onChange={(e) => setApplicationSort(e.target.value as "updated" | "company" | "follow_up" | "stage")}><option value="updated">Recently updated</option><option value="company">Company A–Z</option><option value="follow_up">Next follow-up</option><option value="stage">Pipeline stage</option></select></label>
              {visibleApplications.length === 0 ? <div className="empty-state compact"><h3>{allApplications.length === 0 ? "No applications yet" : query.trim() ? "No matching applications" : "No roles in this stage"}</h3><p>{allApplications.length === 0 ? "Your saved roles will appear here." : query.trim() ? "Try a different search term or clear the search." : "Choose another stage or clear the filter."}</p></div> : <div className="record-list">{visibleApplications.map((item) => <article className="record-card" key={item.id}><div className="record-top"><div className="company-avatar">{item.company.slice(0, 1).toUpperCase()}</div><div className="record-title"><strong>{item.role}</strong><span>{item.company}</span></div><div className="record-actions"><button aria-label="Edit application" onClick={() => editApplication(item)}>Edit</button><button aria-label="Delete application" onClick={() => void removeApplication(item.id)}>Delete</button></div></div><div className="application-meta"><span className={`stage-pill stage-${item.stage ?? "saved"}`}>{formatStage(item.stage ?? "saved")}</span><select className="stage-quick-select" aria-label={`Change stage for ${item.company}`} value={item.stage ?? "saved"} onChange={(event) => void changeApplicationStage(item.id, event.target.value as ApplicationStage)}>{APPLICATION_STAGES.map((stage) => <option key={stage} value={stage}>{formatStage(stage)}</option>)}</select>{item.followUpAt && <span className={item.followUpAt < localDate() ? "follow-up overdue" : "follow-up"}>{item.followUpAt < localDate() ? "Overdue · " : "Follow up · "}{item.followUpAt}</span>}</div><div className="coverage-row"><span>Evidence readiness</span><strong>{allEvidence.filter((e) => e.applicationId === item.id && e.status === "completed").length}/{allEvidence.filter((e) => e.applicationId === item.id).length} ready</strong><div className="coverage-track"><i style={{ width: `${allEvidence.filter((e) => e.applicationId === item.id).length ? (allEvidence.filter((e) => e.applicationId === item.id && e.status === "completed").length / allEvidence.filter((e) => e.applicationId === item.id).length) * 100 : 0}%` }} /></div></div>{item.nextStep && <div className="next-step"><span>↳ Next</span> {item.nextStep}</div>}{item.jobUrl && <a className="record-link" href={item.jobUrl} target="_blank" rel="noreferrer">Open job posting ↗</a>}</article>)}</div>}
            </section>
          </div>}

          {activeView === "evidence" && <div className="two-column">
            <section className="panel-card form-card"><div className="card-heading"><div><h2>{editingEvidence ? "Edit evidence" : "Map a requirement"}</h2><p>Connect a role requirement to something real.</p></div></div>
              <form onSubmit={submitEvidence} className="form-stack">
                <label>Related application<select value={evidenceForm.applicationId ?? ""} onChange={(e) => setEvidenceForm({ ...evidenceForm, applicationId: e.target.value })}><option value="">General evidence / not role-specific</option>{allApplications.map((item) => <option value={item.id} key={item.id}>{item.company} — {item.role}</option>)}</select></label>
                <label>Role requirement<input maxLength={500} required value={evidenceForm.requirement} onChange={(e) => setEvidenceForm({ ...evidenceForm, requirement: e.target.value })} placeholder="e.g. Experience building REST APIs" /></label>
                <label>Evidence title<input maxLength={200} required value={evidenceForm.evidenceTitle} onChange={(e) => setEvidenceForm({ ...evidenceForm, evidenceTitle: e.target.value })} placeholder="e.g. API Automation Framework" /></label>
                <label>Evidence URL<input maxLength={2048} type="url" value={evidenceForm.evidenceUrl} onChange={(e) => setEvidenceForm({ ...evidenceForm, evidenceUrl: e.target.value })} placeholder="GitHub, portfolio, or demo link" /></label>
                <label>Your contribution<textarea maxLength={10000} rows={3} value={evidenceForm.contribution ?? ""} onChange={(e) => setEvidenceForm({ ...evidenceForm, contribution: e.target.value })} placeholder="What did you personally build or contribute?" /></label>
                <label>Context and limitations<textarea maxLength={10000} rows={2} value={evidenceForm.context ?? ""} onChange={(e) => setEvidenceForm({ ...evidenceForm, context: e.target.value })} placeholder="Scope, constraints, or details worth clarifying…" /></label>
                <label>Status<select value={evidenceForm.status ?? "planned"} onChange={(e) => setEvidenceForm({ ...evidenceForm, status: e.target.value as EvidenceStatus })}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label>
                <div className="form-actions"><button className="button button-primary" type="submit">{editingEvidence ? "Save changes" : "Save evidence"}</button>{editingEvidence && <button className="button button-secondary" type="button" onClick={() => { setEditingEvidence(undefined); setEvidenceForm(emptyEvidence); }}>Cancel</button>}</div>
              </form>
            </section>
            <section className="panel-card list-card"><div className="card-heading"><div><h2>Evidence items <span className="count">{visibleEvidence.length}</span></h2><p>What backs up your experience?</p></div></div>
              <SearchBox value={query} onChange={setQuery} />
              <label className="filter-label">Filter by status<select aria-label="Filter evidence by status" value={evidenceStatusFilter} onChange={(e) => setEvidenceStatusFilter(e.target.value as "all" | EvidenceStatus)}><option value="all">All statuses</option>{EVIDENCE_STATUSES.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</select></label>
              <label className="filter-label">Sort evidence by<select aria-label="Sort evidence by" value={evidenceSort} onChange={(e) => setEvidenceSort(e.target.value as "updated" | "requirement" | "status")}><option value="updated">Recently updated</option><option value="requirement">Requirement A–Z</option><option value="status">Evidence status</option></select></label>
              {visibleEvidence.length === 0 ? <div className="empty-state compact"><h3>{allEvidence.length === 0 ? "No evidence mapped yet" : query.trim() ? "No matching evidence" : "No evidence with this status"}</h3><p>{allEvidence.length === 0 ? "Add a requirement and connect it to your work." : query.trim() ? "Try a different search term or clear the search." : "Choose another status or show all statuses."}</p></div> : <div className="record-list">{visibleEvidence.map((item) => <article className="record-card" key={item.id}><div className="evidence-top"><div className="record-title"><strong>{item.requirement}</strong><span>{item.evidenceTitle} · {linkedApplication(item.applicationId)?.company ?? "General evidence"}</span></div><StatusPill status={item.status} /></div>{item.contribution && <p className="evidence-detail"><b>Contribution:</b> {item.contribution}</p>}{item.context && <p className="evidence-detail"><b>Context:</b> {item.context}</p>}<div className="evidence-footer"><select aria-label="Evidence status" value={item.status} onChange={(e) => void changeStatus(item.id, e.target.value as EvidenceStatus)}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select>{item.evidenceUrl && <a href={item.evidenceUrl} target="_blank" rel="noreferrer">Open evidence ↗</a>}<div className="record-actions"><button onClick={() => editEvidence(item)}>Edit</button><button onClick={() => void removeEvidence(item.id)}>Delete</button></div></div></article>)}</div>}
            </section>
          </div>}
          <footer className="footer-note">Built for honest applications. Keep your evidence specific, accurate, and yours.</footer>
        </div>
      </section>
    </main>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="search-box"><span>⌕</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search records…" aria-label="Search records" />{value && <button onClick={() => onChange("")} aria-label="Clear search">×</button>}</div>;
}

function StatusPill({ status }: { status: EvidenceStatus }) {
  return <span className={`status-pill status-${status}`}>{formatStatus(status)}</span>;
}
