import React, { useEffect, useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Kanban,
  ListChecks,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import { api } from "../api/client";
import { useTheme } from "../context/ThemeContext";
import {
  AnimatedList,
  BorderBeam,
  GradientText,
  PillNav,
  SpotlightCard,
  StarBorder,
} from "./reactbits";

const STAGES = [
  {
    id: "NEW",
    label: "New",
    darkColor: "border-slate-500/40 text-slate-300 bg-slate-500/10",
    lightColor: "border-slate-300 text-slate-700 bg-slate-100",
  },
  {
    id: "SCREENED",
    label: "Screened",
    darkColor: "border-violet-400/40 text-violet-200 bg-violet-500/15",
    lightColor: "border-violet-200 text-violet-700 bg-violet-50",
  },
  {
    id: "SHORTLISTED",
    label: "Shortlisted",
    darkColor: "border-fuchsia-400/40 text-fuchsia-200 bg-fuchsia-500/15",
    lightColor: "border-fuchsia-200 text-fuchsia-700 bg-fuchsia-50",
  },
  {
    id: "INTERVIEW",
    label: "Interview",
    darkColor: "border-sky-400/40 text-sky-200 bg-sky-500/15",
    lightColor: "border-sky-200 text-sky-700 bg-sky-50",
  },
  {
    id: "OFFER",
    label: "Offer",
    darkColor: "border-emerald-400/40 text-emerald-200 bg-emerald-500/15",
    lightColor: "border-emerald-200 text-emerald-700 bg-emerald-50",
  },
  {
    id: "REJECTED",
    label: "Rejected",
    darkColor: "border-rose-400/40 text-rose-200 bg-rose-500/15",
    lightColor: "border-rose-200 text-rose-700 bg-rose-50",
  },
];

const TIER_BADGES_DARK = {
  STRONG_MATCH: "border-emerald-400/45 bg-emerald-500/15 text-emerald-300",
  GOOD_FIT: "border-sky-400/45 bg-sky-500/15 text-sky-300",
  POTENTIAL: "border-amber-400/45 bg-amber-500/15 text-amber-300",
  LOW_FIT: "border-rose-400/45 bg-rose-500/15 text-rose-300",
};

const TIER_BADGES_LIGHT = {
  STRONG_MATCH: "border-emerald-200 bg-emerald-50 text-emerald-700",
  GOOD_FIT: "border-sky-200 bg-sky-50 text-sky-700",
  POTENTIAL: "border-amber-200 bg-amber-50 text-amber-700",
  LOW_FIT: "border-rose-200 bg-rose-50 text-rose-700",
};

export function MatchingPipelineView({
  jobs,
  candidates,
  initialJobId = null,
  shortlistThreshold = 68,
  onDataChanged,
  notify,
}) {
  const { isLight } = useTheme();
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [subView, setSubView] = useState("matrix");
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [runningAction, setRunningAction] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);

  const [newJob, setNewJob] = useState({
    title: "",
    department: "Engineering",
    location: "Bengaluru, India",
    work_mode: "Hybrid",
    experience_min: 0.5,
    salary_band: "₹9L – ₹15L / yr",
    min_cgpa: 7.0,
    openings: 2,
    required_skills: "Python, Django, REST APIs, SQL, NLP",
    preferred_skills: "React, Docker, RAG, PostgreSQL",
    description:
      "Build intelligent backend services, NLP extraction pipelines, and scalable REST APIs.",
  });

  useEffect(() => {
    if (initialJobId) {
      setSelectedJobId(initialJobId);
    }
  }, [initialJobId]);

  useEffect(() => {
    if (!selectedJobId && jobs?.length > 0) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const loadMatches = async (jobId) => {
    if (!jobId) return;
    setLoadingMatches(true);
    try {
      const data = await api.getMatches({ job_role: jobId });
      setMatches(data || []);
      if (data?.length > 0) {
        setSelectedMatchId((prev) =>
          data.some((m) => m.id === prev) ? prev : data[0].id
        );
      } else {
        setSelectedMatchId(null);
      }
    } catch (err) {
      notify?.(err.message, "error");
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      loadMatches(selectedJobId);
    }
  }, [selectedJobId, candidates?.length]);

  const selectedJob = useMemo(
    () => (jobs || []).find((j) => j.id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || matches[0] || null,
    [matches, selectedMatchId]
  );

  const radarData = useMemo(() => {
    if (!selectedMatch) return [];
    return [
      {
        metric: "Required Skills",
        score: selectedMatch.required_match_pct || 0,
      },
      {
        metric: "Preferred Skills",
        score: selectedMatch.preferred_match_pct || 0,
      },
      { metric: "Exp & CGPA", score: selectedMatch.experience_score || 0 },
      {
        metric: "Assessment",
        score: selectedMatch.candidate_assessment_score || 0,
      },
      { metric: "ATS Quality", score: selectedMatch.candidate_ats_score || 0 },
    ];
  }, [selectedMatch]);

  const handleRerunMatching = async () => {
    if (!selectedJobId) return;
    setRunningAction(true);
    try {
      const res = await api.matchAllForJob(selectedJobId);
      setMatches(res.matches || []);
      notify?.(
        `Re-evaluated ${res.evaluated_count} candidates for ${selectedJob?.title}!`
      );
      onDataChanged?.();
    } catch (err) {
      notify?.(err.message, "error");
    } finally {
      setRunningAction(false);
    }
  };

  const handleAutoShortlist = async () => {
    if (!selectedJobId) return;
    setRunningAction(true);
    try {
      const res = await api.autoShortlistJob(
        selectedJobId,
        3,
        shortlistThreshold
      );
      setMatches(res.matches || []);
      notify?.(
        `Auto-shortlisted top ${res.shortlisted_count} candidates (≥${shortlistThreshold}%) for ${res.job_role_title}!`
      );
      onDataChanged?.();
    } catch (err) {
      notify?.(err.message, "error");
    } finally {
      setRunningAction(false);
    }
  };

  const handleStageChange = async (candidateId, nextStage) => {
    try {
      await api.updateCandidateStage(candidateId, nextStage);
      setMatches((prev) =>
        prev.map((m) =>
          m.candidate === candidateId ? { ...m, candidate_stage: nextStage } : m
        )
      );
      notify?.(`Moved candidate stage to ${nextStage}`);
      onDataChanged?.();
    } catch (err) {
      notify?.(err.message, "error");
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJob.title.trim()) return;
    setRunningAction(true);
    try {
      const created = await api.createJob({
        ...newJob,
        experience_min: Number(newJob.experience_min) || 0,
        min_cgpa: Number(newJob.min_cgpa) || 6.5,
        openings: Number(newJob.openings) || 1,
      });
      setShowNewJobModal(false);
      setNewJob((prev) => ({ ...prev, title: "" }));
      await onDataChanged?.();
      setSelectedJobId(created.id);
      notify?.(
        `Created role "${created.title}" & automatically matched all candidates!`
      );
    } catch (err) {
      notify?.(err.message, "error");
    } finally {
      setRunningAction(false);
    }
  };

  const tierBadges = isLight ? TIER_BADGES_LIGHT : TIER_BADGES_DARK;
  const modalInputCls = isLight
    ? "w-full rounded-xl border border-slate-900/12 bg-white px-3 py-2 text-slate-900 focus:border-violet-500 focus:outline-none"
    : "w-full rounded-xl border border-violet-500/30 bg-[#09071a] px-3 py-2 text-white focus:border-fuchsia-400 focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider ${
              isLight ? "text-sky-700 font-semibold" : "text-sky-300"
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            4-Pillar Skill-to-Role Matching Pipeline
          </div>
          <h2
            className={`mt-1 font-display text-2xl md:text-3xl font-bold ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            Skill Matching &amp; <GradientText>Shortlisting Studio</GradientText>
          </h2>
          <p
            className={`mt-1 text-sm ${
              isLight ? "text-slate-600" : "text-slate-300"
            }`}
          >
            Select an open role to inspect normalized skill-gap radars, auto-shortlist top candidates, or manage pipeline stages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <PillNav
            layoutId="matching-view-pill"
            activeId={subView}
            onChange={setSubView}
            items={[
              {
                id: "matrix",
                label: "Match Matrix & Radar",
                icon: ListChecks,
              },
              { id: "kanban", label: "Pipeline Kanban", icon: Kanban },
            ]}
          />
          <button
            type="button"
            onClick={() => setShowNewJobModal(true)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
              isLight
                ? "border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100"
                : "border-violet-400/40 bg-violet-500/15 text-violet-100 hover:bg-violet-500/30"
            }`}
          >
            <Plus className="h-4 w-4" />
            New Role
          </button>
        </div>
      </div>

      {/* Role Selector Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(jobs || []).map((job) => {
          const active = job.id === selectedJobId;
          return (
            <button
              key={job.id}
              type="button"
              onClick={() => setSelectedJobId(job.id)}
              className={`rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                active
                  ? isLight
                    ? "border-violet-500 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/70 shadow-[0_10px_28px_-12px_rgba(124,58,237,0.3)] ring-1 ring-violet-500/25"
                    : "border-fuchsia-400/65 bg-gradient-to-br from-violet-600/25 via-fuchsia-600/15 to-sky-500/15 shadow-[0_0_26px_rgba(139,92,246,0.28)]"
                  : isLight
                  ? "border-slate-900/[0.09] bg-white/90 hover:border-violet-300 shadow-xs"
                  : "border-white/10 bg-[#100d26]/70 hover:border-violet-400/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`truncate text-[10px] font-mono uppercase ${
                    isLight ? "text-sky-700 font-semibold" : "text-sky-300"
                  }`}
                >
                  {job.work_mode} · {job.openings} open
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold ${
                    isLight
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-white/10 text-emerald-300"
                  }`}
                >
                  Top {job.top_match_score}%
                </span>
              </div>
              <div
                className={`mt-1.5 font-display text-sm font-bold line-clamp-1 ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                {job.title}
              </div>
              <div
                className={`mt-0.5 text-[11px] truncate ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {job.salary_band}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Role Action Banner */}
      {selectedJob && (
        <SpotlightCard className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Briefcase
                  className={`h-4 w-4 ${
                    isLight ? "text-violet-600" : "text-violet-400"
                  }`}
                />
                <h3
                  className={`font-display text-lg font-bold ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  {selectedJob.title}
                </h3>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-mono ${
                    isLight
                      ? "bg-slate-100 text-slate-600"
                      : "bg-white/10 text-slate-300"
                  }`}
                >
                  {selectedJob.location} · {selectedJob.work_mode}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-mono ${
                    isLight
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-emerald-500/15 text-emerald-300"
                  }`}
                >
                  {selectedJob.salary_band}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(selectedJob.required_skills || []).map((sk) => (
                  <span
                    key={sk}
                    className={`rounded-md border px-2 py-0.5 text-[11px] font-mono ${
                      isLight
                        ? "border-violet-200 bg-violet-50 text-violet-800"
                        : "border-violet-400/30 bg-violet-500/15 text-violet-200"
                    }`}
                  >
                    Req: {sk}
                  </span>
                ))}
                {(selectedJob.preferred_skills || []).slice(0, 4).map((sk) => (
                  <span
                    key={sk}
                    className={`rounded-md border px-2 py-0.5 text-[11px] font-mono ${
                      isLight
                        ? "border-sky-200 bg-sky-50 text-sky-800"
                        : "border-sky-400/25 bg-sky-500/10 text-sky-200"
                    }`}
                  >
                    Pref: {sk}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                disabled={runningAction}
                onClick={handleRerunMatching}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition disabled:opacity-50 cursor-pointer ${
                  isLight
                    ? "border-slate-900/12 bg-white text-slate-700 hover:border-violet-400 hover:text-violet-700"
                    : "border-violet-400/35 bg-white/5 text-slate-100 hover:bg-violet-500/20"
                }`}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    runningAction ? "animate-spin" : ""
                  }`}
                />
                Re-Run Pipeline
              </button>

              <StarBorder
                type="button"
                disabled={runningAction}
                onClick={handleAutoShortlist}
                innerClassName="px-4 py-2 text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Auto-Shortlist (≥{shortlistThreshold}%)</span>
              </StarBorder>
            </div>
          </div>
        </SpotlightCard>
      )}

      {/* Main Content: Matrix+Radar OR Kanban */}
      {subView === "matrix" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Ranked Matches List */}
          <div className="lg:col-span-6">
            <SpotlightCard className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4
                  className={`font-display text-base font-bold ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  Ranked Candidates ({matches.length})
                </h4>
                <span
                  className={`text-[11px] font-mono ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Sorted by Weighted Match %
                </span>
              </div>

              {loadingMatches ? (
                <div className="space-y-2.5 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-20 rounded-xl ${
                        isLight ? "bg-slate-200/70" : "bg-white/5"
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <AnimatedList
                  items={matches}
                  keyExtractor={(m) => m.id}
                  renderItem={(m, idx) => {
                    const isSelected = selectedMatch?.id === m.id;
                    return (
                      <div
                        onClick={() => setSelectedMatchId(m.id)}
                        className={`rounded-xl border p-3.5 transition cursor-pointer ${
                          isSelected
                            ? isLight
                              ? "border-violet-500 bg-violet-50/75 shadow-sm ring-1 ring-violet-400/25"
                              : "border-fuchsia-400/60 bg-violet-500/18 shadow-[0_0_24px_rgba(139,92,246,0.22)]"
                            : isLight
                            ? "border-slate-900/[0.08] bg-[#FAF9FE] hover:border-violet-300 hover:bg-white"
                            : "border-white/10 bg-white/[0.03] hover:border-violet-400/35"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                                isLight
                                  ? "bg-violet-100 text-violet-800"
                                  : "bg-white/10 text-violet-200"
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`font-display text-sm font-bold truncate ${
                                    isLight ? "text-slate-900" : "text-white"
                                  }`}
                                >
                                  {m.candidate_name}
                                </span>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-mono ${
                                    tierBadges[m.recommendation_tier] ||
                                    tierBadges.POTENTIAL
                                  }`}
                                >
                                  {m.recommendation_tier.replace("_", " ")}
                                </span>
                              </div>
                              <div
                                className={`mt-0.5 text-[11px] ${
                                  isLight ? "text-slate-500" : "text-slate-400"
                                }`}
                              >
                                {m.candidate_seniority} · Stage:{" "}
                                <span
                                  className={`font-mono font-semibold ${
                                    isLight ? "text-sky-700" : "text-sky-300"
                                  }`}
                                >
                                  {m.candidate_stage}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div
                              className={`font-display text-xl font-extrabold ${
                                isLight ? "text-sky-700" : "text-sky-300"
                              }`}
                            >
                              {m.overall_score}%
                            </div>
                            <div
                              className={`text-[10px] font-mono ${
                                isLight ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              Req {m.required_match_pct}%
                            </div>
                          </div>
                        </div>

                        {/* Mini Progress Bar */}
                        <div
                          className={`mt-2.5 h-1.5 w-full overflow-hidden rounded-full ${
                            isLight ? "bg-slate-200" : "bg-white/10"
                          }`}
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] via-[#DB2777] to-[#0284C7]"
                            style={{
                              width: `${Math.min(100, m.overall_score)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }}
                />
              )}
            </SpotlightCard>
          </div>

          {/* Right Detailed Skill-Gap Radar & Stage Inspector */}
          <div className="lg:col-span-6">
            {selectedMatch ? (
              <SpotlightCard className="relative p-5 space-y-5">
                <BorderBeam duration={10} />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div
                      className={`text-[11px] font-mono uppercase ${
                        isLight
                          ? "text-fuchsia-700 font-semibold"
                          : "text-fuchsia-300"
                      }`}
                    >
                      Candidate Evaluation Dossier
                    </div>
                    <h3
                      className={`mt-0.5 font-display text-2xl font-extrabold ${
                        isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {selectedMatch.candidate_name}
                    </h3>
                    <div
                      className={`mt-1 flex flex-wrap gap-2 text-xs ${
                        isLight ? "text-slate-600" : "text-slate-300"
                      }`}
                    >
                      <span>{selectedMatch.candidate_seniority}</span>
                      <span>·</span>
                      <span>
                        {selectedMatch.candidate_experience_years} yrs exp
                      </span>
                      {selectedMatch.candidate_cgpa && (
                        <>
                          <span>·</span>
                          <span>CGPA {selectedMatch.candidate_cgpa}/10</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className={`rounded-2xl border px-4 py-2 text-center ${
                      isLight
                        ? "border-sky-200 bg-sky-50"
                        : "border-sky-400/35 bg-sky-500/12"
                    }`}
                  >
                    <div
                      className={`font-display text-2xl font-extrabold ${
                        isLight ? "text-sky-700" : "text-sky-300"
                      }`}
                    >
                      {selectedMatch.overall_score}%
                    </div>
                    <div
                      className={`text-[10px] font-mono ${
                        isLight ? "text-slate-600" : "text-slate-300"
                      }`}
                    >
                      MATCH SCORE
                    </div>
                  </div>
                </div>

                {/* Radar Chart */}
                <div
                  className={`h-60 w-full rounded-xl border p-2 ${
                    isLight
                      ? "border-slate-900/[0.08] bg-[#F8F7FD]"
                      : "border-white/10 bg-[#09071a]/75"
                  }`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid
                        stroke={
                          isLight
                            ? "rgba(124, 58, 237, 0.22)"
                            : "rgba(139, 92, 246, 0.28)"
                        }
                      />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{
                          fill: isLight ? "#334155" : "#cbd5e1",
                          fontSize: 11,
                        }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{
                          fill: isLight ? "#64748b" : "#64748b",
                          fontSize: 10,
                        }}
                      />
                      <Radar
                        name={selectedMatch.candidate_name}
                        dataKey="score"
                        stroke={isLight ? "#DB2777" : "#EC4899"}
                        fill={isLight ? "#7C3AED" : "#8B5CF6"}
                        fillOpacity={isLight ? 0.3 : 0.42}
                        strokeWidth={2}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isLight ? "#ffffff" : "#0e0b24",
                          borderColor: isLight
                            ? "rgba(15,23,42,0.12)"
                            : "rgba(139,92,246,0.4)",
                          color: isLight ? "#0f172a" : "#f8fafc",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Matched vs Missing Skill Chips */}
                <div className="space-y-3">
                  <div>
                    <div
                      className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${
                        isLight ? "text-emerald-700" : "text-emerald-300"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Matched Skills ({selectedMatch.matched_skills?.length || 0})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedMatch.matched_skills || []).map((sk) => (
                        <span
                          key={sk}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-mono ${
                            isLight
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                          }`}
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedMatch.missing_required_skills?.length > 0 && (
                    <div>
                      <div
                        className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${
                          isLight ? "text-rose-700" : "text-rose-300"
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Missing Required Skills (
                        {selectedMatch.missing_required_skills.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMatch.missing_required_skills.map((sk) => (
                          <span
                            key={sk}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-mono ${
                              isLight
                                ? "border-rose-200 bg-rose-50 text-rose-800"
                                : "border-rose-400/35 bg-rose-500/15 text-rose-200"
                            }`}
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMatch.missing_preferred_skills?.length > 0 && (
                    <div>
                      <div
                        className={`mb-1.5 text-xs font-semibold ${
                          isLight ? "text-amber-700" : "text-amber-300"
                        }`}
                      >
                        Missing Preferred / Bonus Skills
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMatch.missing_preferred_skills.map((sk) => (
                          <span
                            key={sk}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-mono ${
                              isLight
                                ? "border-amber-200 bg-amber-50 text-amber-800"
                                : "border-amber-400/30 bg-amber-500/10 text-amber-200"
                            }`}
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rationale */}
                <div
                  className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
                    isLight
                      ? "border-violet-200 bg-violet-50/70 text-slate-700"
                      : "border-violet-400/25 bg-violet-500/10 text-slate-200"
                  }`}
                >
                  <span
                    className={`font-mono font-semibold uppercase mr-1.5 ${
                      isLight ? "text-violet-700" : "text-violet-300"
                    }`}
                  >
                    Hiring Rationale:
                  </span>
                  {selectedMatch.rationale}
                </div>

                {/* Pipeline Stage Controls */}
                <div>
                  <div
                    className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    <UserCheck
                      className={`h-3.5 w-3.5 ${
                        isLight ? "text-sky-600" : "text-sky-400"
                      }`}
                    />
                    Move Candidate Pipeline Stage:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STAGES.map((st) => {
                      const active = selectedMatch.candidate_stage === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() =>
                            handleStageChange(selectedMatch.candidate, st.id)
                          }
                          className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                            active
                              ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow"
                              : isLight
                              ? "border-slate-200 bg-white text-slate-600 hover:border-violet-400 hover:text-violet-700"
                              : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-400/45 hover:text-white"
                          }`}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </SpotlightCard>
            ) : (
              <SpotlightCard
                className={`flex h-full min-h-[320px] items-center justify-center p-8 text-sm ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Select a candidate on the left to inspect their skill-gap radar.
              </SpotlightCard>
            )}
          </div>
        </div>
      ) : (
        /* Interactive Pipeline Kanban Board */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((stage, stageIdx) => {
            const stageCandidates = (candidates || []).filter(
              (c) => c.pipeline_stage === stage.id
            );
            const nextStage =
              stageIdx < STAGES.length - 2 ? STAGES[stageIdx + 1] : null;
            return (
              <div
                key={stage.id}
                className={`flex flex-col rounded-2xl border p-3 min-h-[360px] ${
                  isLight
                    ? "border-slate-900/[0.09] bg-white/85 shadow-xs"
                    : "border-violet-500/20 bg-[#0e0b23]/80"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`rounded-lg border px-2 py-0.5 text-[11px] font-mono font-semibold ${
                      isLight ? stage.lightColor : stage.darkColor
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span
                    className={`font-mono text-xs ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {stageCandidates.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {stageCandidates.map((cand) => {
                    const roleMatch = (cand.top_matches || []).find(
                      (m) => m.job_role === selectedJobId
                    );
                    const score =
                      roleMatch?.overall_score ??
                      cand.top_matches?.[0]?.overall_score ??
                      cand.ats_score;
                    return (
                      <div
                        key={cand.id}
                        className={`rounded-xl border p-3 transition ${
                          isLight
                            ? "border-slate-200/90 bg-[#FAF9FE] hover:border-violet-400 hover:bg-white shadow-2xs"
                            : "border-white/10 bg-white/[0.04] hover:border-violet-400/45"
                        }`}
                      >
                        <div
                          className={`font-display text-xs font-bold ${
                            isLight ? "text-slate-900" : "text-white"
                          }`}
                        >
                          {cand.full_name}
                        </div>
                        <div
                          className={`mt-0.5 text-[10px] ${
                            isLight ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {cand.seniority_level} · ATS {cand.ats_score}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold ${
                              isLight
                                ? "bg-sky-50 text-sky-700"
                                : "bg-sky-500/15 text-sky-300"
                            }`}
                          >
                            Fit {score}%
                          </span>
                          {nextStage && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStageChange(cand.id, nextStage.id)
                              }
                              title={`Advance to ${nextStage.label}`}
                              className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                                isLight
                                  ? "bg-violet-100 text-violet-800 hover:bg-violet-600 hover:text-white"
                                  : "bg-violet-500/25 text-violet-100 hover:bg-fuchsia-500/35"
                              }`}
                            >
                              {nextStage.label}
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {stageCandidates.length === 0 && (
                    <div
                      className={`rounded-xl border border-dashed py-8 text-center text-[11px] ${
                        isLight
                          ? "border-slate-200 text-slate-400"
                          : "border-white/10 text-slate-500"
                      }`}
                    >
                      No candidates
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create New Job Role Modal */}
      {showNewJobModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
            isLight ? "bg-slate-900/35" : "bg-black/75"
          }`}
        >
          <div
            className={`relative w-full max-w-xl rounded-2xl border p-6 shadow-2xl ${
              isLight
                ? "border-slate-900/12 bg-white text-slate-900"
                : "border-violet-400/35 bg-[#100d27] text-slate-100"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">
                Create New Job Role
              </h3>
              <button
                type="button"
                onClick={() => setShowNewJobModal(false)}
                className={`rounded-lg p-1 cursor-pointer ${
                  isLight
                    ? "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateJob} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    className={`mb-1 block font-medium ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    Role Title *
                  </label>
                  <input
                    required
                    value={newJob.title}
                    onChange={(e) =>
                      setNewJob({ ...newJob, title: e.target.value })
                    }
                    placeholder="e.g., GenAI Platform Engineer"
                    className={modalInputCls}
                  />
                </div>
                <div>
                  <label
                    className={`mb-1 block font-medium ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    Department
                  </label>
                  <input
                    value={newJob.department}
                    onChange={(e) =>
                      setNewJob({ ...newJob, department: e.target.value })
                    }
                    className={modalInputCls}
                  />
                </div>
                <div>
                  <label
                    className={`mb-1 block font-medium ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    Location
                  </label>
                  <input
                    value={newJob.location}
                    onChange={(e) =>
                      setNewJob({ ...newJob, location: e.target.value })
                    }
                    className={modalInputCls}
                  />
                </div>
                <div>
                  <label
                    className={`mb-1 block font-medium ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    Work Mode
                  </label>
                  <select
                    value={newJob.work_mode}
                    onChange={(e) =>
                      setNewJob({ ...newJob, work_mode: e.target.value })
                    }
                    className={modalInputCls}
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>
                <div>
                  <label
                    className={`mb-1 block font-medium ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    Salary Band
                  </label>
                  <input
                    value={newJob.salary_band}
                    onChange={(e) =>
                      setNewJob({ ...newJob, salary_band: e.target.value })
                    }
                    className={modalInputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      className={`mb-1 block font-medium ${
                        isLight ? "text-slate-700" : "text-slate-300"
                      }`}
                    >
                      Min Exp (yrs)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={newJob.experience_min}
                      onChange={(e) =>
                        setNewJob({ ...newJob, experience_min: e.target.value })
                      }
                      className={modalInputCls}
                    />
                  </div>
                  <div>
                    <label
                      className={`mb-1 block font-medium ${
                        isLight ? "text-slate-700" : "text-slate-300"
                      }`}
                    >
                      Min CGPA
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={newJob.min_cgpa}
                      onChange={(e) =>
                        setNewJob({ ...newJob, min_cgpa: e.target.value })
                      }
                      className={modalInputCls}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  className={`mb-1 block font-medium ${
                    isLight ? "text-slate-700" : "text-slate-300"
                  }`}
                >
                  Required Skills (comma-separated)
                </label>
                <input
                  value={newJob.required_skills}
                  onChange={(e) =>
                    setNewJob({ ...newJob, required_skills: e.target.value })
                  }
                  className={modalInputCls}
                />
              </div>

              <div>
                <label
                  className={`mb-1 block font-medium ${
                    isLight ? "text-slate-700" : "text-slate-300"
                  }`}
                >
                  Preferred Skills (comma-separated)
                </label>
                <input
                  value={newJob.preferred_skills}
                  onChange={(e) =>
                    setNewJob({ ...newJob, preferred_skills: e.target.value })
                  }
                  className={modalInputCls}
                />
              </div>

              <div>
                <label
                  className={`mb-1 block font-medium ${
                    isLight ? "text-slate-700" : "text-slate-300"
                  }`}
                >
                  Role Description
                </label>
                <textarea
                  rows={2}
                  value={newJob.description}
                  onChange={(e) =>
                    setNewJob({ ...newJob, description: e.target.value })
                  }
                  className={modalInputCls}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewJobModal(false)}
                  className={`rounded-xl border px-4 py-2 cursor-pointer ${
                    isLight
                      ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                      : "border-white/15 text-slate-300 hover:bg-white/5"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={runningAction}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 font-semibold text-white hover:brightness-110 cursor-pointer"
                >
                  Create &amp; Auto-Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
