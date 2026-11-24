import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ClipboardPaste,
  FileText,
  FileUp,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UploadCloud,
  Wand2,
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

const SAMPLE_RESUMES = [
  {
    id: "ai-django",
    label: "AI & Django Engineer",
    badge: "NLP / RAG",
    filename: "Kavya_Ramesh_AI_Django.txt",
    text: `Kavya Ramesh
Bengaluru, India | kavya.ramesh@example.dev | +91 98451 77290
https://linkedin.com/in/kavya-ramesh-ai | https://github.com/kavyaramesh-nlp

SUMMARY
Software & AI Engineer with 1.5 years of experience designing Django REST APIs, NLP extraction services, and hybrid RAG chatbots for enterprise knowledge workflows.

EDUCATION
B.E. in Computer Science and Engineering, RV College of Engineering — CGPA: 8.9 / 10

TECHNICAL SKILLS
Languages: Python, SQL, JavaScript, HTML, CSS
Frameworks: Django, Django REST Framework, React, Tailwind CSS, FastAPI, REST APIs
Databases: PostgreSQL, SQLite, Redis
AI/ML/NLP: NLP, RAG, Machine Learning, TF-IDF, BM25, Scikit-learn, Pandas, NumPy, Hugging Face, LLMs
Cloud/DevOps & Core CS: Docker, Git, GitHub, AWS, Data Structures & Algorithms, OOP, System Design, PyTest

EXPERIENCE
Backend AI Engineer — SynthMind Technologies (Jul 2024 - Present)
- Engineered Django REST Framework NLP parsing pipelines processing 12,000+ resumes weekly with 95% skill extraction accuracy.
- Built BM25 + semantic RAG support assistant lowering recruiter screening turnaround by 48%.

PROJECTS
Enterprise Policy RAG Assistant | Python, Django, RAG, BM25, PostgreSQL, React
- Built citation-backed HR & recruitment Q&A assistant indexing 500+ policy chunks with sub-180ms retrieval latency.

Automated Candidate Ranking Engine | Python, Scikit-learn, NLP, Docker
- Designed explainable weighted matching model increasing shortlist precision by 34%.

CERTIFICATIONS
- AWS Certified Machine Learning Specialty
- NPTEL Gold Medal in Natural Language Processing`,
  },
  {
    id: "spring-fullstack",
    label: "Full-Stack Spring Boot Dev",
    badge: "Java / React",
    filename: "Siddharth_Verma_SpringBoot.txt",
    text: `Siddharth Verma
Chennai, India | siddharth.verma@example.dev | +91 97908 31245
https://linkedin.com/in/siddharth-verma-java | https://github.com/sidverma-dev

SUMMARY
Full-Stack Engineer with 2 years of experience building cloud-ready Java Spring Boot microservices and responsive React + TypeScript dashboards.

EDUCATION
B.Tech in Computer Science, SRM Institute of Science and Technology — CGPA: 8.35 / 10

TECHNICAL SKILLS
Java, Spring Boot, Hibernate, JPA, React, TypeScript, JavaScript, Tailwind CSS, REST APIs, Microservices, PostgreSQL, MySQL, Docker, AWS, JWT, OAuth2, Git, GitHub Actions, CI/CD, OOP, DBMS, JUnit

EXPERIENCE
Software Engineer — PayGrid Cloud (Jun 2024 - Present)
- Developed Spring Boot payment ledger APIs serving 65,000 daily transactions with 99.98% availability.
- Built React + TypeScript analytics dashboard reducing merchant onboarding time by 32%.

PROJECTS
Placement & Campus Readiness Portal | Java, Spring Boot, React, MySQL, JWT
- Engineered multi-role student analytics dashboard tracking coding milestones and readiness scores for 900+ learners.

CERTIFICATIONS
- Oracle Certified Associate Java SE Programmer
- AWS Certified Cloud Practitioner`,
  },
  {
    id: "data-ml",
    label: "Data & ML Specialist",
    badge: "SQL / ML",
    filename: "Nikhil_Kulkarni_DataML.txt",
    text: `Nikhil Kulkarni
Pune, India | nikhil.kulkarni@example.dev | +91 98221 55091
https://linkedin.com/in/nikhil-kulkarni-ml | https://github.com/nikhilk-ml

SUMMARY
Data Analyst & Applied ML specialist with 1 year of experience in SQL warehousing, Power BI executive reporting, and Scikit-learn predictive modeling.

EDUCATION
B.Tech in Data Science, COEP Technological University — CGPA: 8.65 / 10

TECHNICAL SKILLS
Python, SQL, PostgreSQL, MySQL, Pandas, NumPy, Scikit-learn, Machine Learning, Deep Learning, PyTorch, Data Analysis, Predictive Analytics, Feature Engineering, Power BI, Tableau, Statistical Modeling, Git, NLP

EXPERIENCE
Data Analyst — RetailIQ Analytics (May 2025 - Present)
- Authored PostgreSQL window-function ETL views and Power BI executive KPIs accelerating weekly business reviews by 55%.
- Trained demand forecasting ensemble achieving 91% forecast accuracy across 400 product lines.

PROJECTS
Talent Attrition & Funnel Forecasting Suite | Python, SQL, Power BI, Scikit-learn
- Built interactive attrition risk scoring pipeline and hiring funnel forecasts across 10,000+ historical employee records.

CERTIFICATIONS
- Microsoft Certified: Power BI Data Analyst Associate
- Coursera Machine Learning Specialization`,
  },
];

const CATEGORY_COLORS_DARK = {
  Languages: "border-violet-400/35 bg-violet-500/15 text-violet-200",
  Frameworks: "border-fuchsia-400/35 bg-fuchsia-500/15 text-fuchsia-200",
  Databases: "border-sky-400/35 bg-sky-500/15 text-sky-200",
  "AI/ML/NLP": "border-emerald-400/35 bg-emerald-500/15 text-emerald-200",
  "Cloud/DevOps": "border-amber-400/35 bg-amber-500/15 text-amber-200",
  "Core CS": "border-indigo-400/35 bg-indigo-500/15 text-indigo-200",
};

const CATEGORY_COLORS_LIGHT = {
  Languages: "border-violet-200 bg-violet-50 text-violet-800",
  Frameworks: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
  Databases: "border-sky-200 bg-sky-50 text-sky-800",
  "AI/ML/NLP": "border-emerald-200 bg-emerald-50 text-emerald-800",
  "Cloud/DevOps": "border-amber-200 bg-amber-50 text-amber-800",
  "Core CS": "border-indigo-200 bg-indigo-50 text-indigo-800",
};

function AtsScoreRing({ score = 0, isLight = false }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="relative flex h-32 w-32 items-center justify-center shrink-0">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="atsRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isLight ? "#7C3AED" : "#8B5CF6"} />
            <stop offset="50%" stopColor={isLight ? "#DB2777" : "#EC4899"} />
            <stop offset="100%" stopColor={isLight ? "#0284C7" : "#38BDF8"} />
          </linearGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke={isLight ? "rgba(15,23,42,0.09)" : "rgba(255,255,255,0.1)"}
          strokeWidth="10"
          fill="none"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          stroke="url(#atsRingGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={`font-display text-2xl font-extrabold ${
            isLight ? "text-slate-900" : "text-white"
          }`}
        >
          {Math.round(score)}
        </span>
        <span
          className={`text-[10px] font-mono uppercase ${
            isLight ? "text-slate-500" : "text-slate-400"
          }`}
        >
          ATS Score
        </span>
      </div>
    </div>
  );
}

export function ResumeParserView({ onCandidateAdded, notify }) {
  const { isLight } = useTheme();
  const [inputMode, setInputMode] = useState("upload");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [pastedFilename, setPastedFilename] = useState("pasted_resume.txt");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const categoryColors = isLight ? CATEGORY_COLORS_LIGHT : CATEGORY_COLORS_DARK;

  const handleFilePick = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setError("");
  };

  const runParse = async ({ textOverride, filenameOverride } = {}) => {
    setError("");
    setParsing(true);
    try {
      let data;
      if (textOverride) {
        data = await api.parseResumeText(textOverride, {
          filename: filenameOverride || "sample_resume.txt",
        });
      } else if (inputMode === "upload") {
        if (!selectedFile) {
          throw new Error(
            "Please select or drop a .pdf, .docx, or .txt resume file."
          );
        }
        data = await api.parseResumeFile(selectedFile);
      } else {
        if (!pastedText.trim()) {
          throw new Error(
            "Please paste resume text or pick one of the 1-click sample resumes."
          );
        }
        data = await api.parseResumeText(pastedText, {
          filename: pastedFilename || "pasted_resume.txt",
        });
      }
      setResult(data);
      notify?.(
        `Parsed ${data.candidate.full_name} (${data.candidate.extracted_skills.length} skills) & matched against ${data.matches.length} open roles!`
      );
      onCandidateAdded?.();
    } catch (err) {
      setError(err.message || "Failed to parse resume.");
    } finally {
      setParsing(false);
    }
  };

  const handleSampleClick = (sample) => {
    setInputMode("paste");
    setPastedText(sample.text);
    setPastedFilename(sample.filename);
    runParse({ textOverride: sample.text, filenameOverride: sample.filename });
  };

  const cand = result?.candidate;
  const matches = result?.matches || [];
  const atsFeedback = cand?.ats_feedback || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider ${
              isLight ? "text-violet-700 font-semibold" : "text-violet-300"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Pure-Python NLP Entity &amp; ATS Pipeline
          </div>
          <h2
            className={`mt-1 font-display text-2xl md:text-3xl font-bold ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            Resume Parser &amp; <GradientText>Candidate Profiler</GradientText>
          </h2>
          <p
            className={`mt-1 text-sm ${
              isLight ? "text-slate-600" : "text-slate-300"
            }`}
          >
            Upload PDF, DOCX, or TXT resumes — or test instantly with one-click sample resumes — to extract structured profiles and compute live job role matches.
          </p>
        </div>

        <PillNav
          layoutId="parser-mode-pill"
          activeId={inputMode}
          onChange={(id) => {
            setInputMode(id);
            setError("");
          }}
          items={[
            { id: "upload", label: "Upload File", icon: FileUp },
            { id: "paste", label: "Paste Resume Text", icon: ClipboardPaste },
          ]}
        />
      </div>

      {/* One-Click Sample Resumes Bar */}
      <SpotlightCard className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div
            className={`flex items-center gap-2 text-xs font-semibold ${
              isLight ? "text-fuchsia-700" : "text-fuchsia-200"
            }`}
          >
            <Wand2
              className={`h-4 w-4 ${
                isLight ? "text-fuchsia-600" : "text-fuchsia-400"
              }`}
            />
            <span>One-Click Live NLP Demo Resumes:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_RESUMES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                disabled={parsing}
                onClick={() => handleSampleClick(sample)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition disabled:opacity-50 cursor-pointer ${
                  isLight
                    ? "border-violet-200 bg-violet-50/80 text-violet-900 hover:border-fuchsia-400 hover:bg-fuchsia-50"
                    : "border-violet-400/30 bg-violet-500/12 text-violet-100 hover:border-fuchsia-400/60 hover:bg-fuchsia-500/20"
                }`}
              >
                <span>{sample.label}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                    isLight
                      ? "bg-white text-sky-700 border border-slate-200"
                      : "bg-white/10 text-sky-300"
                  }`}
                >
                  {sample.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </SpotlightCard>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Input Column */}
        <div className="lg:col-span-5">
          <SpotlightCard className="relative p-5">
            <BorderBeam duration={9} />
            {inputMode === "upload" ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={(e) => handleFilePick(e.target.files?.[0])}
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFilePick(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex min-h-[250px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                    isDragging
                      ? isLight
                        ? "border-fuchsia-500 bg-fuchsia-50"
                        : "border-fuchsia-400 bg-fuchsia-500/15"
                      : isLight
                      ? "border-violet-300 bg-[#F8F6FE] hover:border-violet-500 hover:bg-violet-50/70"
                      : "border-violet-500/35 bg-white/[0.02] hover:border-violet-400/60 hover:bg-violet-500/5"
                  }`}
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
                      isLight
                        ? "border-violet-200 bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-700"
                        : "border-violet-400/30 bg-gradient-to-br from-violet-600/40 to-fuchsia-600/40 text-violet-200"
                    }`}
                  >
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <h3
                    className={`mt-4 font-display text-base font-bold ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {selectedFile ? selectedFile.name : "Drop Resume File Here"}
                  </h3>
                  <p
                    className={`mt-1 text-xs max-w-xs ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB ready for NLP extraction`
                      : "Supports native .PDF (pypdf), .DOCX (pure-Python XML), and .TXT files up to 10MB"}
                  </p>
                  <span
                    className={`mt-4 rounded-lg border px-3 py-1 text-xs font-medium ${
                      isLight
                        ? "border-slate-900/12 bg-white text-slate-700 shadow-xs"
                        : "border-white/15 bg-white/5 text-slate-200"
                    }`}
                  >
                    Browse Local File
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    className={`text-xs font-semibold ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    Raw Resume Text
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {pastedText.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  rows={12}
                  placeholder="Paste full resume content (Name, Contact, Education, CGPA, Technical Skills, Experience, Projects, Certifications)..."
                  className={`w-full rounded-xl border p-3.5 text-xs font-mono leading-relaxed focus:outline-none ${
                    isLight
                      ? "border-slate-900/12 bg-[#FAF9FE] text-slate-900 placeholder:text-slate-400 focus:border-violet-500"
                      : "border-violet-500/30 bg-[#09071a]/90 text-slate-100 placeholder:text-slate-500 focus:border-fuchsia-400/60"
                  }`}
                />
              </div>
            )}

            {error && (
              <div
                className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                  isLight
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-rose-500/40 bg-rose-500/15 text-rose-200"
                }`}
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <div
                className={`text-[11px] ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Auto-saves to Django DB &amp; evaluates against all open roles
              </div>
              <StarBorder
                type="button"
                disabled={parsing}
                onClick={() => runParse()}
                innerClassName="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
              >
                <Sparkles
                  className={`h-4 w-4 ${parsing ? "animate-spin" : ""}`}
                />
                <span>{parsing ? "Parsing NLP..." : "Parse & Profile"}</span>
              </StarBorder>
            </div>
          </SpotlightCard>
        </div>

        {/* Parsed Output Column */}
        <div className="lg:col-span-7 space-y-5">
          {!cand ? (
            <SpotlightCard className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${
                  isLight
                    ? "border-violet-200 bg-violet-50 text-violet-600"
                    : "border-violet-400/25 bg-violet-500/15 text-violet-300"
                }`}
              >
                <FileText className="h-8 w-8" />
              </div>
              <h3
                className={`mt-4 font-display text-xl font-bold ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                Ready for Live NLP Extraction
              </h3>
              <p
                className={`mt-2 max-w-md text-sm ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Upload any resume file or click one of the 3 sample resumes above to see real-time entity extraction, categorized technical skills, ATS quality diagnostics, and automated job matching!
              </p>
            </SpotlightCard>
          ) : (
            <motion.div
              key={cand.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Candidate Profile + ATS Ring */}
              <SpotlightCard className="p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`font-display text-2xl font-extrabold ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}
                      >
                        {cand.full_name}
                      </h3>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          isLight
                            ? "border-violet-200 bg-violet-50 text-violet-700"
                            : "border-violet-400/40 bg-violet-500/15 text-violet-200"
                        }`}
                      >
                        {cand.seniority_level}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-mono ${
                          isLight
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-emerald-400/35 bg-emerald-500/15 text-emerald-300"
                        }`}
                      >
                        {cand.pipeline_stage}
                      </span>
                    </div>

                    <div
                      className={`flex flex-wrap gap-x-4 gap-y-1.5 text-xs ${
                        isLight ? "text-slate-600" : "text-slate-300"
                      }`}
                    >
                      {cand.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-violet-500" />
                          {cand.email}
                        </span>
                      )}
                      {cand.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-fuchsia-500" />
                          {cand.phone}
                        </span>
                      )}
                      {cand.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-sky-500" />
                          {cand.location}
                        </span>
                      )}
                    </div>

                    <div
                      className={`flex flex-wrap items-center gap-3 text-xs ${
                        isLight ? "text-slate-600" : "text-slate-300"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-sky-500" />
                        {cand.education}
                      </span>
                      {cand.cgpa && (
                        <span
                          className={`rounded-md px-2 py-0.5 font-mono ${
                            isLight
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : "bg-sky-500/15 text-sky-300"
                          }`}
                        >
                          CGPA {cand.cgpa}/10
                        </span>
                      )}
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono ${
                          isLight
                            ? "bg-slate-100 text-slate-700"
                            : "bg-white/10 text-slate-200"
                        }`}
                      >
                        {cand.experience_years} yrs exp
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {cand.github_url && (
                        <a
                          href={cand.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] transition ${
                            isLight
                              ? "border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-400"
                              : "border-white/10 bg-white/5 text-slate-200 hover:border-violet-400/50"
                          }`}
                        >
                          <Github className="h-3 w-3" /> GitHub
                        </a>
                      )}
                      {cand.linkedin_url && (
                        <a
                          href={cand.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] transition ${
                            isLight
                              ? "border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-400"
                              : "border-white/10 bg-white/5 text-slate-200 hover:border-sky-400/50"
                          }`}
                        >
                          <Linkedin className="h-3 w-3" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </div>

                  <AtsScoreRing score={cand.ats_score} isLight={isLight} />
                </div>

                {/* Preliminary Screening Summary */}
                <div
                  className={`mt-4 rounded-xl border p-3.5 text-xs leading-relaxed ${
                    isLight
                      ? "border-violet-200 bg-violet-50/70 text-slate-700"
                      : "border-violet-400/20 bg-violet-500/8 text-slate-200"
                  }`}
                >
                  <span
                    className={`font-mono font-semibold uppercase mr-2 ${
                      isLight ? "text-violet-700" : "text-violet-300"
                    }`}
                  >
                    AI Screening Summary:
                  </span>
                  {cand.screening_summary}
                </div>

                {/* Strengths & Suggestions */}
                {(atsFeedback.strengths?.length > 0 ||
                  atsFeedback.suggestions?.length > 0) && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div
                      className={`rounded-xl border p-3 ${
                        isLight
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-emerald-500/25 bg-emerald-500/8"
                      }`}
                    >
                      <div
                        className={`text-[11px] font-mono font-semibold uppercase mb-1.5 ${
                          isLight ? "text-emerald-700" : "text-emerald-300"
                        }`}
                      >
                        ATS Strengths
                      </div>
                      <ul
                        className={`space-y-1 text-xs ${
                          isLight ? "text-slate-700" : "text-slate-300"
                        }`}
                      >
                        {(atsFeedback.strengths || []).map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div
                      className={`rounded-xl border p-3 ${
                        isLight
                          ? "border-amber-200 bg-amber-50/70"
                          : "border-amber-500/25 bg-amber-500/8"
                      }`}
                    >
                      <div
                        className={`text-[11px] font-mono font-semibold uppercase mb-1.5 ${
                          isLight ? "text-amber-700" : "text-amber-300"
                        }`}
                      >
                        Optimization Suggestions
                      </div>
                      <ul
                        className={`space-y-1 text-xs ${
                          isLight ? "text-slate-700" : "text-slate-300"
                        }`}
                      >
                        {(atsFeedback.suggestions?.length
                          ? atsFeedback.suggestions
                          : [
                              "Resume passes all core ATS completeness benchmarks!",
                            ]
                        ).map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Award className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </SpotlightCard>

              {/* Categorized Skills */}
              <SpotlightCard className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h4
                    className={`font-display text-base font-bold ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    Extracted Skills Taxonomy ({cand.extracted_skills?.length || 0})
                  </h4>
                  <span
                    className={`text-[11px] font-mono ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {Object.keys(cand.skill_categories || {}).length} Domains
                  </span>
                </div>
                <div className="space-y-3">
                  {Object.entries(cand.skill_categories || {}).map(
                    ([cat, sks]) => (
                      <div key={cat}>
                        <div
                          className={`mb-1.5 text-[11px] font-mono uppercase tracking-wider ${
                            isLight ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {cat}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sks.map((sk) => (
                            <span
                              key={sk}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                                categoryColors[cat] || categoryColors.Languages
                              }`}
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </SpotlightCard>

              {/* Extracted Projects & Certifications */}
              {(cand.projects?.length > 0 ||
                cand.certifications?.length > 0) && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SpotlightCard className="p-4">
                    <h4
                      className={`font-display text-sm font-bold mb-2.5 ${
                        isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      Extracted Projects ({cand.projects?.length || 0})
                    </h4>
                    <div className="space-y-2.5">
                      {(cand.projects || []).map((proj, idx) => (
                        <div
                          key={idx}
                          className={`rounded-xl border p-3 ${
                            isLight
                              ? "border-slate-200 bg-[#F8F7FD]"
                              : "border-white/10 bg-white/[0.03]"
                          }`}
                        >
                          <div
                            className={`text-xs font-semibold ${
                              isLight ? "text-violet-800" : "text-violet-200"
                            }`}
                          >
                            {proj.name}
                          </div>
                          <div
                            className={`mt-1 text-[11px] leading-relaxed ${
                              isLight ? "text-slate-600" : "text-slate-400"
                            }`}
                          >
                            {proj.summary}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SpotlightCard>

                  <SpotlightCard className="p-4">
                    <h4
                      className={`font-display text-sm font-bold mb-2.5 ${
                        isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      Certifications ({cand.certifications?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {(cand.certifications?.length
                        ? cand.certifications
                        : ["No formal certifications listed."]
                      ).map((cert, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 rounded-xl border p-2.5 text-xs ${
                            isLight
                              ? "border-slate-200 bg-[#F8F7FD] text-slate-700"
                              : "border-white/10 bg-white/[0.03] text-slate-200"
                          }`}
                        >
                          <Award className="h-3.5 w-3.5 text-fuchsia-500 shrink-0 mt-0.5" />
                          <span>{cert}</span>
                        </div>
                      ))}
                    </div>
                  </SpotlightCard>
                </div>
              )}

              {/* Instant Automated Job Role Matches */}
              <SpotlightCard className="p-5">
                <h4
                  className={`font-display text-base font-bold mb-3 ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  Instant Automated Role Matches ({matches.length} Open Roles)
                </h4>
                <AnimatedList
                  items={matches}
                  keyExtractor={(m) => m.id}
                  renderItem={(m) => (
                    <div
                      className={`flex flex-col gap-2 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between ${
                        isLight
                          ? "border-slate-200 bg-[#F8F7FD]"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-sm ${
                              isLight ? "text-slate-900" : "text-white"
                            }`}
                          >
                            {m.job_role_title}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                              isLight
                                ? "bg-violet-100 text-violet-800"
                                : "bg-violet-500/20 text-violet-200"
                            }`}
                          >
                            {m.recommendation_tier.replace("_", " ")}
                          </span>
                        </div>
                        <p
                          className={`mt-1 text-[11px] ${
                            isLight ? "text-slate-600" : "text-slate-400"
                          }`}
                        >
                          {m.rationale}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
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
                  )}
                />
              </SpotlightCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
