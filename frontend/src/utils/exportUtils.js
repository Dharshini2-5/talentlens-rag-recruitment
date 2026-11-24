function escapeCsv(val) {
  if (val === null || val === undefined) return "";
  const str = Array.isArray(val) ? val.join("; ") : String(val);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function timestampSlug() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export function exportCandidatesCsv(candidates = []) {
  const headers = [
    "ID",
    "Full Name",
    "Email",
    "Phone",
    "Location",
    "Seniority",
    "Experience (Yrs)",
    "Education",
    "CGPA",
    "ATS Score",
    "Pipeline Stage",
    "Extracted Skills",
    "Top Match Role",
    "Top Match Score",
  ];
  const rows = candidates.map((c) => {
    const topMatch = c.top_matches?.[0];
    return [
      c.id,
      c.full_name,
      c.email,
      c.phone,
      c.location,
      c.seniority_level,
      c.experience_years,
      c.education,
      c.cgpa ?? "",
      c.ats_score,
      c.pipeline_stage,
      c.extracted_skills || [],
      topMatch?.job_role_title || "",
      topMatch?.overall_score ?? "",
    ]
      .map(escapeCsv)
      .join(",");
  });
  const csv = [headers.join(","), ...rows].join("\r\n");
  const filename = `talentlens_candidates_${timestampSlug()}.csv`;
  triggerDownload(csv, filename, "text/csv;charset=utf-8;");
  return { filename, count: candidates.length };
}

export function exportMatchesCsv(matches = []) {
  const headers = [
    "Match ID",
    "Candidate",
    "Job Role",
    "Overall Score (%)",
    "Required Match (%)",
    "Preferred Match (%)",
    "Experience Score (%)",
    "Recommendation Tier",
    "Pipeline Stage",
    "Matched Skills",
    "Missing Required Skills",
    "Rationale",
  ];
  const rows = matches.map((m) =>
    [
      m.id,
      m.candidate_name,
      m.job_role_title,
      m.overall_score,
      m.required_match_pct,
      m.preferred_match_pct,
      m.experience_score,
      m.recommendation_tier,
      m.candidate_stage,
      m.matched_skills || [],
      m.missing_required_skills || [],
      m.rationale,
    ]
      .map(escapeCsv)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\r\n");
  const filename = `talentlens_skill_matches_${timestampSlug()}.csv`;
  triggerDownload(csv, filename, "text/csv;charset=utf-8;");
  return { filename, count: matches.length };
}

export function exportTalentSnapshotJson({
  workspace,
  overview,
  jobs = [],
  candidates = [],
  matches = [],
  knowledgeDocs = [],
}) {
  const payload = {
    exported_at: new Date().toISOString(),
    platform: "TalentLens AI SaaS Studio",
    workspace: workspace?.name || "TalentLens HQ — Engineering",
    summary_kpis: overview?.kpis || {},
    hiring_funnel: overview?.funnel || [],
    skill_demand_vs_supply: overview?.skill_demand_vs_supply || [],
    jobs,
    candidates,
    matches,
    knowledge_documents: knowledgeDocs.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      chunk_count: d.chunk_count,
      tags: d.tags,
    })),
  };
  const filename = `talentlens_snapshot_${timestampSlug()}.json`;
  triggerDownload(
    JSON.stringify(payload, null, 2),
    filename,
    "application/json;charset=utf-8;"
  );
  return { filename, counts: { jobs: jobs.length, candidates: candidates.length, matches: matches.length } };
}
