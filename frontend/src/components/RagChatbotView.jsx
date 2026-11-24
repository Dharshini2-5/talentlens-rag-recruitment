import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Bot,
  ChevronDown,
  ChevronUp,
  Database,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { api } from "../api/client";
import { useTheme } from "../context/ThemeContext";
import {
  BorderBeam,
  GradientText,
  Orb,
  PillNav,
  SpotlightCard,
} from "./reactbits";

const STARTER_PROMPTS = [
  {
    mode: "applicant",
    label: "Interview Rounds & Salary",
    query:
      "What are the interview rounds, timeline, and salary for AI/NLP Backend Engineer?",
  },
  {
    mode: "recruiter",
    label: "Top Django & NLP Talent",
    query: "Who are the strongest candidates with Django and NLP skills?",
  },
  {
    mode: "applicant",
    label: "Campus CGPA & Remote Policy",
    query: "Tell me about campus hiring CGPA eligibility and remote work policy.",
  },
  {
    mode: "recruiter",
    label: "Pipeline Funnel Snapshot",
    query: "Show recruitment pipeline funnel statistics and top matches.",
  },
];

const DOC_CATEGORIES = [
  "POLICY",
  "INTERVIEW_PROCESS",
  "JOB_FAQ",
  "BENEFITS",
  "CULTURE",
  "TECHNICAL_RUBRIC",
];

function FormattedMessage({ text, isLight }) {
  const lines = (text || "").split("\n");
  return (
    <div
      className={`space-y-1.5 text-xs md:text-sm leading-relaxed ${
        isLight ? "text-slate-700" : "text-slate-200"
      }`}
    >
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.startsWith("### ")) {
          return (
            <h4
              key={i}
              className={`font-display text-sm md:text-base font-bold pt-1 ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              {line.slice(4)}
            </h4>
          );
        }
        if (line.startsWith("#### ")) {
          return (
            <h5
              key={i}
              className={`font-display text-xs md:text-sm font-semibold pt-1 ${
                isLight ? "text-violet-700" : "text-violet-300"
              }`}
            >
              {line.slice(5)}
            </h5>
          );
        }

        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        return (
          <p key={i} className={line.trim().startsWith("-") ? "pl-3" : ""}>
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong
                    key={pIdx}
                    className={`font-semibold ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith("`") && part.endsWith("`")) {
                return (
                  <code
                    key={pIdx}
                    className={`rounded px-1.5 py-0.5 text-[11px] font-mono ${
                      isLight
                        ? "bg-violet-100 text-violet-800"
                        : "bg-violet-500/20 text-sky-300"
                    }`}
                  >
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return <React.Fragment key={pIdx}>{part}</React.Fragment>;
            })}
          </p>
        );
      })}
    </div>
  );
}

export function RagChatbotView({
  knowledgeDocs,
  onKnowledgeChanged,
  notify,
}) {
  const { isLight } = useTheme();
  const [sessionId] = useState(
    () => `talentlens-${Math.random().toString(36).slice(2, 10)}`
  );
  const [chatMode, setChatMode] = useState("auto");
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [indexedCount, setIndexedCount] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "### Welcome to TalentLens AI RAG Assistant\n\nI retrieve live answers grounded across **HR Recruitment Policies**, **Open Job Roles**, and **NLP-Parsed Candidate Profiles** using hybrid **BM25 + TF-IDF cosine similarity**.\n\nAsk me anything as an **Applicant** (interview rounds, salaries, benefits, CGPA cutoffs) or as a **Recruiter** (find candidates with Django/NLP/Spring Boot, inspect pipeline stats), or add a brand-new policy document on the right to test live RAG indexing!",
      confidence: 0.99,
      retrieved_sources: [],
      follow_ups: [
        "What are the interview rounds and timeline?",
        "Who are the strongest candidates with Django and NLP skills?",
        "List all open job roles and salary bands",
      ],
    },
  ]);

  // Knowledge Base Manager State
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [filterCat, setFilterCat] = useState("ALL");
  const [savingDoc, setSavingDoc] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: "",
    category: "POLICY",
    tags: "internship, stipend, referral",
    content: "",
  });

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const sendQuery = async (overrideText) => {
    const queryText = (overrideText ?? input).trim();
    if (!queryText || thinking) return;

    const tempUser = {
      id: `user-${Date.now()}`,
      role: "user",
      content: queryText,
    };
    setMessages((prev) => [...prev, tempUser]);
    setInput("");
    setThinking(true);

    try {
      const res = await api.queryChat(queryText, sessionId, chatMode);
      setIndexedCount(res.indexed_chunks_count);
      const assistantMsg = {
        id: res.assistant_message?.id || `asst-${Date.now()}`,
        role: "assistant",
        content: res.answer,
        confidence: res.confidence,
        intent: res.intent,
        retrieved_sources: res.retrieved_sources || [],
        follow_ups: res.follow_ups || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setExpandedSources((prev) => ({ ...prev, [assistantMsg.id]: true }));
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Could not reach the RAG endpoint: ${err.message}`,
          confidence: 0,
          retrieved_sources: [],
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!newDoc.title.trim() || !newDoc.content.trim()) return;
    setSavingDoc(true);
    try {
      const created = await api.createKnowledge(newDoc);
      setNewDoc({
        title: "",
        category: "POLICY",
        tags: "",
        content: "",
      });
      setShowAddDoc(false);
      await onKnowledgeChanged?.();
      notify?.(
        `Indexed "${created.title}" (${created.chunk_count} chunk(s)) into live RAG store! Try asking about it now.`
      );
    } catch (err) {
      notify?.(err.message, "error");
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (doc) => {
    try {
      await api.deleteKnowledge(doc.id);
      await onKnowledgeChanged?.();
      notify?.(`Removed "${doc.title}" from RAG Knowledge Base.`);
    } catch (err) {
      notify?.(err.message, "error");
    }
  };

  const filteredDocs = (knowledgeDocs || []).filter(
    (d) => filterCat === "ALL" || d.category === filterCat
  );

  const kbInputCls = isLight
    ? "w-full rounded-lg border border-slate-900/12 bg-white px-2.5 py-2 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
    : "w-full rounded-lg border border-violet-500/30 bg-[#141030] px-2.5 py-2 text-white focus:outline-none";

  return (
    <div className="space-y-5">
      {/* Studio Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider ${
              isLight ? "text-fuchsia-700 font-semibold" : "text-fuchsia-300"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Hybrid BM25 + TF-IDF Cosine Retrieval Engine
          </div>
          <h2
            className={`mt-1 font-display text-2xl md:text-3xl font-bold ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            RAG Smart <GradientText>Recruitment Chatbot</GradientText>
          </h2>
          <p
            className={`mt-1 text-sm ${
              isLight ? "text-slate-600" : "text-slate-300"
            }`}
          >
            Citation-grounded Q&amp;A across HR policies, open roles, and live parsed candidates with instant Knowledge Base ingestion.
          </p>
        </div>

        <PillNav
          layoutId="rag-mode-pill"
          activeId={chatMode}
          onChange={setChatMode}
          items={[
            { id: "auto", label: "Auto Intent", icon: Sparkles },
            { id: "applicant", label: "Applicant Mode", icon: User },
            { id: "recruiter", label: "Recruiter Mode", icon: Users },
          ]}
        />
      </div>

      {/* Split Workspace: 70% Chat / 30% Live Knowledge Base */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Chat Studio */}
        <div className="lg:col-span-8">
          <SpotlightCard className="relative flex h-[670px] flex-col overflow-hidden">
            <BorderBeam duration={11} />
            {/* Chat Header with Reactive Orb */}
            <div
              className={`flex items-center justify-between border-b px-4 py-3 ${
                isLight
                  ? "border-slate-900/[0.08] bg-[#FAF9FE]"
                  : "border-violet-500/20 bg-[#0d0a22]/90"
              }`}
            >
              <div className="flex items-center gap-3">
                <Orb size={50} active={thinking} />
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-display text-sm font-bold ${
                        isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      TalentLens RAG Copilot
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold ${
                        thinking
                          ? isLight
                            ? "bg-fuchsia-100 text-fuchsia-700 animate-pulse"
                            : "bg-fuchsia-500/25 text-fuchsia-200 animate-pulse"
                          : isLight
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {thinking ? "RETRIEVING CHUNKS..." : "ONLINE"}
                    </span>
                  </div>
                  <div
                    className={`text-[11px] font-mono ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {indexedCount
                      ? `${indexedCount} live chunks indexed (KB + Roles + Candidates)`
                      : `${knowledgeDocs?.length || 10} KB Docs + Live Roles & Candidates`}
                  </div>
                </div>
              </div>

              <div
                className={`hidden sm:flex items-center gap-1.5 text-[11px] font-mono font-semibold ${
                  isLight ? "text-sky-700" : "text-sky-300"
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                <span>Mode: {chatMode.toUpperCase()}</span>
              </div>
            </div>

            {/* Starter Prompts Strip */}
            <div
              className={`flex gap-2 overflow-x-auto border-b px-4 py-2.5 ${
                isLight
                  ? "border-slate-900/[0.06] bg-white"
                  : "border-white/5 bg-white/[0.015]"
              }`}
            >
              {STARTER_PROMPTS.map((sp) => (
                <button
                  key={sp.label}
                  type="button"
                  onClick={() => sendQuery(sp.query)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition cursor-pointer ${
                    isLight
                      ? "border-violet-200 bg-violet-50/75 text-violet-800 hover:border-fuchsia-400 hover:bg-fuchsia-50"
                      : "border-violet-400/30 bg-violet-500/12 text-violet-100 hover:border-fuchsia-400/60 hover:bg-fuchsia-500/20"
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>

            {/* Messages Thread */}
            <div
              className={`flex-1 space-y-4 overflow-y-auto p-4 ${
                isLight ? "bg-[#FBFAFE]/65" : ""
              }`}
            >
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                const sourcesOpen = !!expandedSources[msg.id];
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                        isUser
                          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg"
                          : isLight
                          ? "border border-slate-900/[0.09] bg-white text-slate-800 shadow-xs"
                          : "border border-violet-500/20 bg-[#120e2b]/90 text-slate-100"
                      }`}
                    >
                      {isUser ? (
                        <p className="text-sm text-white">{msg.content}</p>
                      ) : (
                        <>
                          <FormattedMessage
                            text={msg.content}
                            isLight={isLight}
                          />

                          {/* Confidence & Retrieved Sources Accordion */}
                          {msg.retrieved_sources?.length > 0 && (
                            <div
                              className={`mt-3 border-t pt-2.5 ${
                                isLight
                                  ? "border-slate-200/90"
                                  : "border-white/10"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedSources((prev) => ({
                                    ...prev,
                                    [msg.id]: !prev[msg.id],
                                  }))
                                }
                                className={`flex w-full items-center justify-between text-[11px] font-mono font-semibold cursor-pointer ${
                                  isLight
                                    ? "text-sky-700 hover:text-violet-700"
                                    : "text-sky-300 hover:text-sky-200"
                                }`}
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  <BookOpen className="h-3.5 w-3.5" />
                                  Retrieved RAG Sources (
                                  {msg.retrieved_sources.length}) · Confidence{" "}
                                  {Math.round((msg.confidence || 0) * 100)}%
                                </span>
                                {sourcesOpen ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                              </button>

                              {sourcesOpen && (
                                <div className="mt-2 space-y-2">
                                  {msg.retrieved_sources.map((src, sIdx) => (
                                    <div
                                      key={`${src.chunk_id}-${sIdx}`}
                                      className={`rounded-xl border p-2.5 text-[11px] ${
                                        isLight
                                          ? "border-violet-200/80 bg-[#F6F4FC]"
                                          : "border-violet-400/20 bg-[#09071a]/85"
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                                        <span
                                          className={`font-semibold ${
                                            isLight
                                              ? "text-violet-900"
                                              : "text-violet-200"
                                          }`}
                                        >
                                          {src.title}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                                              isLight
                                                ? "bg-white text-slate-600 border border-slate-200"
                                                : "bg-white/10 text-slate-300"
                                            }`}
                                          >
                                            {src.category}
                                          </span>
                                          <span
                                            className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold ${
                                              isLight
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-emerald-500/20 text-emerald-300"
                                            }`}
                                          >
                                            {Math.round(
                                              src.relevance_score * 100
                                            )}
                                            % rel
                                          </span>
                                        </div>
                                      </div>
                                      <p
                                        className={`mt-1 line-clamp-2 leading-relaxed ${
                                          isLight
                                            ? "text-slate-600"
                                            : "text-slate-400"
                                        }`}
                                      >
                                        {src.snippet}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Follow-up Prompt Chips */}
                          {msg.follow_ups?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {msg.follow_ups.map((fu) => (
                                <button
                                  key={fu}
                                  type="button"
                                  onClick={() => sendQuery(fu)}
                                  className={`rounded-lg border px-2.5 py-1 text-[11px] transition cursor-pointer text-left ${
                                    isLight
                                      ? "border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-400 hover:bg-sky-100"
                                      : "border-sky-400/25 bg-sky-500/10 text-sky-200 hover:border-sky-400/55 hover:bg-sky-500/20"
                                  }`}
                                >
                                  ↳ {fu}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {thinking && (
                <div
                  className={`flex items-center gap-3 text-xs font-mono ${
                    isLight ? "text-fuchsia-700" : "text-fuchsia-300"
                  }`}
                >
                  <Orb size={34} active={true} />
                  <span>
                    Scoring BM25 + TF-IDF chunks &amp; grounding answer...
                  </span>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendQuery();
              }}
              className={`flex items-center gap-2 border-t p-3 ${
                isLight
                  ? "border-slate-900/[0.08] bg-white"
                  : "border-violet-500/20 bg-[#0c091e]/95"
              }`}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about interview rounds, salaries, policies, or search candidates by skills..."
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm focus:outline-none ${
                  isLight
                    ? "border-slate-900/12 bg-[#F7F6FC] text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white"
                    : "border-violet-500/30 bg-[#141030] text-white placeholder:text-slate-500 focus:border-fuchsia-400/60"
                }`}
              />
              <button
                type="submit"
                disabled={thinking || !input.trim()}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-500 px-4 text-xs font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-45 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Send</span>
              </button>
            </form>
          </SpotlightCard>
        </div>

        {/* Right Live Knowledge Base Manager Sidebar */}
        <div className="lg:col-span-4">
          <SpotlightCard className="flex h-[670px] flex-col p-4">
            <div
              className={`flex items-center justify-between gap-2 pb-3 border-b ${
                isLight ? "border-slate-200" : "border-white/10"
              }`}
            >
              <div>
                <h3
                  className={`font-display text-base font-bold ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  Live Knowledge Base
                </h3>
                <p
                  className={`text-[11px] ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Add policies or FAQs — indexed immediately for RAG
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDoc((v) => !v)}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                {showAddDoc ? "Close" : "Add Doc"}
              </button>
            </div>

            {showAddDoc && (
              <form
                onSubmit={handleAddDocument}
                className={`mt-3 space-y-2.5 rounded-xl border p-3 text-xs ${
                  isLight
                    ? "border-violet-200 bg-[#F8F6FE]"
                    : "border-fuchsia-400/35 bg-[#0b081d]"
                }`}
              >
                <input
                  required
                  value={newDoc.title}
                  onChange={(e) =>
                    setNewDoc({ ...newDoc, title: e.target.value })
                  }
                  placeholder="Document Title (e.g., Referral Bonus Policy)"
                  className={kbInputCls}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newDoc.category}
                    onChange={(e) =>
                      setNewDoc({ ...newDoc, category: e.target.value })
                    }
                    className={kbInputCls}
                  >
                    {DOC_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    value={newDoc.tags}
                    onChange={(e) =>
                      setNewDoc({ ...newDoc, tags: e.target.value })
                    }
                    placeholder="tags, comma, sep"
                    className={kbInputCls}
                  />
                </div>
                <textarea
                  required
                  rows={3}
                  value={newDoc.content}
                  onChange={(e) =>
                    setNewDoc({ ...newDoc, content: e.target.value })
                  }
                  placeholder="Write policy details or FAQ answers. As soon as you save, ask the RAG chatbot about it!"
                  className={kbInputCls}
                />
                <button
                  type="submit"
                  disabled={savingDoc}
                  className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2 font-semibold text-white hover:brightness-110 cursor-pointer"
                >
                  {savingDoc
                    ? "Chunking & Indexing..."
                    : "Save & Index for Live RAG"}
                </button>
              </form>
            )}

            {/* Category Filter Pills */}
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-2">
              {["ALL", ...DOC_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCat(cat)}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-mono transition cursor-pointer ${
                    filterCat === cat
                      ? "bg-violet-600 text-white font-semibold"
                      : isLight
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      : "bg-white/5 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Documents List */}
            <div className="mt-2 flex-1 space-y-2.5 overflow-y-auto pr-1">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`group rounded-xl border p-3 transition ${
                    isLight
                      ? "border-slate-900/[0.08] bg-[#FAF9FE] hover:border-violet-400 hover:bg-white"
                      : "border-white/10 bg-white/[0.03] hover:border-violet-400/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold ${
                          isLight
                            ? "bg-violet-100 text-violet-800"
                            : "bg-violet-500/20 text-violet-200"
                        }`}
                      >
                        {doc.category}
                      </span>
                      <h4
                        className={`mt-1 text-xs font-semibold ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}
                      >
                        {doc.title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc)}
                      title="Delete document"
                      className={`rounded-md p-1 opacity-60 transition group-hover:opacity-100 cursor-pointer ${
                        isLight
                          ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          : "text-slate-500 hover:bg-rose-500/20 hover:text-rose-300"
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p
                    className={`mt-1.5 text-[11px] line-clamp-3 leading-relaxed ${
                      isLight ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {doc.content}
                  </p>
                  <div
                    className={`mt-2 flex items-center justify-between text-[10px] font-mono ${
                      isLight ? "text-slate-500" : "text-slate-500"
                    }`}
                  >
                    <span>{doc.chunk_count} chunk(s)</span>
                    <button
                      type="button"
                      onClick={() => sendQuery(`Tell me about ${doc.title}`)}
                      className={`font-semibold cursor-pointer ${
                        isLight
                          ? "text-sky-700 hover:text-violet-700"
                          : "text-sky-400 hover:text-sky-300"
                      }`}
                    >
                      Test in Chat →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
