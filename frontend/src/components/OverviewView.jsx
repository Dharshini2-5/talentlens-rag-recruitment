import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Award,
  Bot,
  Briefcase,
  Database,
  FileSearch,
  GitBranch,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import {
  AnimatedList,
  BorderBeam,
  CountUp,
  GradientText,
  SpotlightCard,
} from "./reactbits";

const FUNNEL_COLORS_DARK = [
  "#8B5CF6",
  "#A855F7",
  "#EC4899",
  "#38BDF8",
  "#10B981",
  "#64748B",
];

const FUNNEL_COLORS_LIGHT = [
  "#7C3AED",
  "#9333EA",
  "#DB2777",
  "#0284C7",
  "#059669",
  "#64748B",
];

const TIER_STYLES_DARK = {
  STRONG_MATCH:
    "border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
  GOOD_FIT: "border-sky-400/40 bg-sky-500/15 text-sky-300",
  POTENTIAL: "border-amber-400/40 bg-amber-500/15 text-amber-300",
  LOW_FIT: "border-rose-400/40 bg-rose-500/15 text-rose-300",
};

const TIER_STYLES_LIGHT = {
  STRONG_MATCH:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  GOOD_FIT: "border-sky-200 bg-sky-50 text-sky-700",
  POTENTIAL: "border-amber-200 bg-amber-50 text-amber-700",
  LOW_FIT: "border-rose-200 bg-rose-50 text-rose-700",
};

const CustomTooltip = ({ active, payload, label, isLight }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className={`rounded-xl border px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-md ${
        isLight
          ? "border-slate-900/12 bg-white/96 text-slate-900"
          : "border-violet-400/35 bg-[#0e0b24]/95 text-slate-100"
      }`}
    >
      <div
        className={`font-semibold mb-1 ${
          isLight ? "text-slate-900" : "text-white"
        }`}
      >
        {label}
      </div>
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          className={`flex items-center justify-between gap-4 ${
            isLight ? "text-slate-600" : "text-slate-300"
          }`}
        >
          <span style={{ color: entry.color }} className="font-medium">
            {entry.name}:
          </span>
          <span
            className={`font-mono font-semibold ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function OverviewView({ overview, loading, onNavigate }) {
  const { isLight } = useTheme();

  if (loading && !overview) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-32 rounded-2xl ${
              isLight ? "bg-slate-200/70" : "bg-white/5"
            }`}
          />
        ))}
      </div>
    );
  }

  const kpis = overview?.kpis || {};
  const funnel = overview?.funnel || [];
  const skillChart = overview?.skill_demand_vs_supply || [];
  const topMatches = overview?.top_matches || [];
  const funnelColors = isLight ? FUNNEL_COLORS_LIGHT : FUNNEL_COLORS_DARK;
  const tierStyles = isLight ? TIER_STYLES_LIGHT : TIER_STYLES_DARK;
  const axisTickColor = isLight ? "#475569" : "#94a3b8";
  const gridColor = isLight
    ? "rgba(15, 23, 42, 0.08)"
    : "rgba(139, 92, 246, 0.14)";
  const axisLineColor = isLight
    ? "rgba(15, 23, 42, 0.14)"
    : "rgba(139, 92, 246, 0.2)";

  const cards = [
    {
      title: "Total Candidates",
      value: kpis.total_candidates || 0,
      subtitle: `${kpis.shortlisted_candidates || 0} in Shortlisted / Interview / Offer`,
      icon: Users,
      accent: isLight ? "text-violet-700" : "text-violet-300",
      iconBg: isLight ? "bg-violet-100/80" : "bg-white/[0.06]",
      spotlight: "rgba(139, 92, 246, 0.28)",
    },
    {
      title: "Open Roles",
      value: kpis.open_roles || 0,
      subtitle: `${kpis.total_openings || 0} total active headcount openings`,
      icon: Briefcase,
      accent: isLight ? "text-fuchsia-700" : "text-fuchsia-300",
      iconBg: isLight ? "bg-fuchsia-100/80" : "bg-white/[0.06]",
      spotlight: "rgba(236, 72, 153, 0.26)",
    },
    {
      title: "Avg ATS Quality",
      value: kpis.avg_ats_score || 0,
      decimals: 1,
      suffix: "%",
      subtitle: `Avg skill-role match: ${kpis.avg_match_score || 0}%`,
      icon: Award,
      accent: isLight ? "text-sky-700" : "text-sky-300",
      iconBg: isLight ? "bg-sky-100/80" : "bg-white/[0.06]",
      spotlight: "rgba(56, 189, 248, 0.25)",
    },
    {
      title: "RAG Knowledge Base",
      value: kpis.indexed_rag_chunks || 0,
      subtitle: `${kpis.knowledge_docs || 0} HR docs + live roles & profiles`,
      icon: Database,
      accent: isLight ? "text-emerald-700" : "text-emerald-300",
      iconBg: isLight ? "bg-emerald-100/80" : "bg-white/[0.06]",
      spotlight: "rgba(16, 185, 129, 0.24)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative glass-panel overflow-hidden rounded-2xl p-6">
        <BorderBeam duration={10} />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div
              className={`inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider ${
                isLight ? "text-fuchsia-700 font-semibold" : "text-fuchsia-300"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Live Recruitment Telemetry
            </div>
            <h2
              className={`mt-1 font-display text-2xl md:text-3xl font-bold ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              Hiring Funnel &amp; <GradientText>Talent Intelligence</GradientText>
            </h2>
            <p
              className={`mt-1 text-sm ${
                isLight ? "text-slate-600" : "text-slate-300"
              }`}
            >
              Real-time candidate profiling, skill supply vs. demand insights, and top ranked role matches.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate("parser")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-xs md:text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:brightness-110 cursor-pointer"
            >
              <FileSearch className="h-4 w-4" />
              Parse New Resume
            </button>
            <button
              type="button"
              onClick={() => onNavigate("chatbot")}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs md:text-sm font-semibold transition cursor-pointer ${
                isLight
                  ? "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100"
                  : "border-sky-400/35 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25"
              }`}
            >
              <Bot
                className={`h-4 w-4 ${
                  isLight ? "text-sky-600" : "text-sky-300"
                }`}
              />
              Ask RAG Chatbot
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <SpotlightCard
              key={card.title}
              spotlightColor={card.spotlight}
              className="p-5"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {card.title}
                </span>
                <div className={`rounded-lg p-2 ${card.iconBg}`}>
                  <Icon className={`h-4 w-4 ${card.accent}`} />
                </div>
              </div>
              <div
                className={`mt-3 font-display text-3xl font-extrabold ${card.accent}`}
              >
                <CountUp
                  to={card.value}
                  decimals={card.decimals || 0}
                  suffix={card.suffix || ""}
                />
              </div>
              <div
                className={`mt-1.5 text-xs ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {card.subtitle}
              </div>
            </SpotlightCard>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Hiring Funnel Chart */}
        <SpotlightCard className="p-5 lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3
                className={`font-display text-lg font-bold ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                Hiring Pipeline Funnel
              </h3>
              <p
                className={`text-xs ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Candidate distribution across workflow stages
              </p>
            </div>
            <TrendingUp
              className={`h-4 w-4 ${
                isLight ? "text-violet-600" : "text-violet-400"
              }`}
            />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnel}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: axisTickColor, fontSize: 11 }}
                  axisLine={{ stroke: axisLineColor }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: axisTickColor, fontSize: 11 }}
                  axisLine={{ stroke: axisLineColor }}
                />
                <Tooltip content={<CustomTooltip isLight={isLight} />} />
                <Bar dataKey="count" name="Candidates" radius={[8, 8, 0, 0]}>
                  {funnel.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={funnelColors[index % funnelColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>

        {/* Skill Supply vs Demand Chart */}
        <SpotlightCard className="p-5 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3
                className={`font-display text-lg font-bold ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                Top Skills: Role Demand vs. Talent Supply
              </h3>
              <p
                className={`text-xs ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Weighted job requirement demand compared with parsed candidate skills
              </p>
            </div>
            <GitBranch
              className={`h-4 w-4 ${
                isLight ? "text-fuchsia-600" : "text-fuchsia-400"
              }`}
            />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={skillChart}
                margin={{ top: 8, right: 8, left: -18, bottom: 18 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="skill"
                  tick={{ fill: axisTickColor, fontSize: 10 }}
                  angle={-22}
                  textAnchor="end"
                  interval={0}
                  axisLine={{ stroke: axisLineColor }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: axisTickColor, fontSize: 11 }}
                  axisLine={{ stroke: axisLineColor }}
                />
                <Tooltip content={<CustomTooltip isLight={isLight} />} />
                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    paddingTop: "8px",
                    color: axisTickColor,
                  }}
                />
                <Bar
                  dataKey="demand"
                  name="Role Demand"
                  fill={isLight ? "#DB2777" : "#EC4899"}
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="supply"
                  name="Candidate Supply"
                  fill={isLight ? "#0284C7" : "#38BDF8"}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SpotlightCard>
      </div>

      {/* Top Ranked Candidate-Role Matches AnimatedList */}
      <SpotlightCard className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3
              className={`font-display text-lg font-bold ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              Top Ranked Candidate-Role Matches
            </h3>
            <p
              className={`text-xs ${
                isLight ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Automatically scored by the 4-pillar skill-to-role matching pipeline
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("matching")}
            className={`text-xs font-semibold transition cursor-pointer ${
              isLight
                ? "text-violet-700 hover:text-fuchsia-600"
                : "text-violet-300 hover:text-fuchsia-300"
            }`}
          >
            Open Matching Pipeline →
          </button>
        </div>

        <AnimatedList
          items={topMatches}
          keyExtractor={(m) => m.id}
          renderItem={(m) => (
            <div
              className={`flex flex-col gap-3 rounded-xl border px-4 py-3.5 transition md:flex-row md:items-center md:justify-between ${
                isLight
                  ? "border-slate-900/[0.08] bg-[#F8F7FD] hover:border-violet-400/60 hover:bg-white"
                  : "border-white/10 bg-white/[0.03] hover:border-violet-400/40"
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-display text-sm md:text-base font-bold ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {m.candidate_name}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span
                    className={`text-sm font-medium ${
                      isLight ? "text-violet-700" : "text-violet-300"
                    }`}
                  >
                    {m.job_role_title}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold ${
                      tierStyles[m.recommendation_tier] || tierStyles.POTENTIAL
                    }`}
                  >
                    {m.recommendation_tier.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {(m.matched_skills || []).slice(0, 6).map((sk) => (
                    <span
                      key={sk}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-mono ${
                        isLight
                          ? "bg-violet-100/80 text-violet-800"
                          : "bg-violet-500/15 text-violet-200"
                      }`}
                    >
                      {sk}
                    </span>
                  ))}
                  {m.missing_required_skills?.length > 0 && (
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-mono ${
                        isLight
                          ? "bg-rose-50 text-rose-700"
                          : "bg-rose-500/15 text-rose-300"
                      }`}
                    >
                      Gap: {m.missing_required_skills.slice(0, 2).join(", ")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div
                    className={`font-display text-2xl font-extrabold ${
                      isLight ? "text-sky-700" : "text-sky-300"
                    }`}
                  >
                    {m.overall_score}%
                  </div>
                  <div
                    className={`text-[10px] font-mono uppercase ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Req {m.required_match_pct}% · Stage {m.candidate_stage}
                  </div>
                </div>
              </div>
            </div>
          )}
        />
      </SpotlightCard>
    </div>
  );
}
