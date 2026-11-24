const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8002/api";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const isFormData = options.body instanceof FormData;
  const headers = isFormData
    ? { ...(options.headers || {}) }
    : {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.detail ||
      (typeof data === "object" && data
        ? Object.values(data).flat().join(" ")
        : null) ||
      `Request failed with HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  getHealth: () => request("/health/"),
  getOverview: () => request("/overview/"),

  // Job Roles
  getJobs: () => request("/jobs/"),
  createJob: (payload) =>
    request("/jobs/", { method: "POST", body: JSON.stringify(payload) }),
  updateJob: (id, payload) =>
    request(`/jobs/${id}/`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteJob: (id) => request(`/jobs/${id}/`, { method: "DELETE" }),
  matchAllForJob: (id) =>
    request(`/jobs/${id}/match-all/`, { method: "POST" }),
  autoShortlistJob: (id, topN = 3, minScore = 68) =>
    request(`/jobs/${id}/auto-shortlist/`, {
      method: "POST",
      body: JSON.stringify({ top_n: topN, min_score: minScore }),
    }),

  // Candidates & NLP Resume Parsing
  getCandidates: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/candidates/${qs ? `?${qs}` : ""}`);
  },
  parseResumeText: (resumeText, extra = {}) =>
    request("/candidates/parse-resume/", {
      method: "POST",
      body: JSON.stringify({ resume_text: resumeText, ...extra }),
    }),
  parseResumeFile: (file, extra = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        formData.append(k, String(v));
      }
    });
    return request("/candidates/parse-resume/", {
      method: "POST",
      body: formData,
    });
  },
  updateCandidateStage: (id, stage) =>
    request(`/candidates/${id}/stage/`, {
      method: "PATCH",
      body: JSON.stringify({ pipeline_stage: stage }),
    }),
  deleteCandidate: (id) => request(`/candidates/${id}/`, { method: "DELETE" }),

  // Match Evaluations
  getMatches: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/matches/${qs ? `?${qs}` : ""}`);
  },

  // Knowledge Base
  getKnowledge: () => request("/knowledge/"),
  createKnowledge: (payload) =>
    request("/knowledge/", { method: "POST", body: JSON.stringify(payload) }),
  deleteKnowledge: (id) => request(`/knowledge/${id}/`, { method: "DELETE" }),

  // RAG Chatbot
  queryChat: (query, sessionId, mode = "auto") =>
    request("/chat/query/", {
      method: "POST",
      body: JSON.stringify({ query, session_id: sessionId, mode }),
    }),
  getChatHistory: (sessionId) =>
    request(
      `/chat/history/${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""}`
    ),
};
