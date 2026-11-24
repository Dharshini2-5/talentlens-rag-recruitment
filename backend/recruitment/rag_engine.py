"""Pure-Python Hybrid RAG (BM25 + TF-IDF Cosine Similarity) Recruitment Chatbot Engine.

Indexes:
  1. All KnowledgeDocument rows (chunked with sentence-aware overlapping windows)
  2. Live structured JobRole cards synthesized from the database
  3. Live structured Candidate + top MatchEvaluation dossiers synthesized from the database

Answers BOTH applicant queries (interview process, salaries, benefits, eligibility, remote policy)
AND recruiter queries (candidate search by skills, top matches, shortlisting insights, pipeline stats)
with verifiable retrieved source snippets, relevance scores, confidence, and follow-up suggestions.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass
from typing import Any

from .models import Candidate, JobRole, KnowledgeDocument, MatchEvaluation
from .nlp_parser import extract_ngrams, extract_skills, tokenize


@dataclass
class RAGChunk:
    chunk_id: str
    doc_id: int | None
    title: str
    category: str
    source_type: str  # "knowledge" | "job_role" | "candidate"
    text: str
    metadata: dict[str, Any]
    tokens: list[str]


def chunk_document_text(text: str, max_words: int = 85, overlap_words: int = 18) -> list[str]:
    """Split a knowledge document into sentence-aware overlapping retrieval chunks."""
    cleaned = re.sub(r"\r\n?", "\n", (text or "").strip())
    if not cleaned:
        return []
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", cleaned) if p.strip()]
    chunks: list[str] = []

    for para in paragraphs:
        words = para.split()
        if len(words) <= max_words:
            chunks.append(para)
            continue
        start = 0
        while start < len(words):
            end = min(len(words), start + max_words)
            chunks.append(" ".join(words[start:end]))
            if end >= len(words):
                break
            start = max(0, end - overlap_words)

    return chunks or [cleaned]


def _build_corpus_chunks() -> list[RAGChunk]:
    """Build live unified RAG index from KnowledgeDocuments, JobRoles, and Candidates."""
    chunks: list[RAGChunk] = []

    # 1. Knowledge Base Documents
    for doc in KnowledgeDocument.objects.all():
        doc_chunks = chunk_document_text(doc.content)
        if doc.chunk_count != len(doc_chunks):
            KnowledgeDocument.objects.filter(pk=doc.pk).update(chunk_count=len(doc_chunks))
        tag_str = ", ".join(doc.tags or [])
        for idx, chunk_text in enumerate(doc_chunks):
            indexable = f"{doc.title} {doc.category.replace('_', ' ')} {tag_str} {chunk_text}"
            unigrams = tokenize(indexable, remove_stopwords=True, stem=True)
            bigrams = extract_ngrams(unigrams, 2)
            chunks.append(
                RAGChunk(
                    chunk_id=f"kb-{doc.id}-{idx}",
                    doc_id=doc.id,
                    title=doc.title,
                    category=doc.category,
                    source_type="knowledge",
                    text=chunk_text,
                    metadata={"tags": doc.tags or []},
                    tokens=unigrams + bigrams,
                )
            )

    # 2. Live JobRole Records
    for job in JobRole.objects.all():
        req_str = ", ".join(job.required_skills or [])
        pref_str = ", ".join(job.preferred_skills or [])
        text = (
            f"Job Opening: {job.title} in {job.department} ({job.status}). "
            f"Location: {job.location} ({job.work_mode}). Salary Band: {job.salary_band}. "
            f"Openings: {job.openings}. Minimum Experience: {job.experience_min} years. "
            f"Minimum CGPA: {job.min_cgpa}. Required Skills: {req_str}. "
            f"Preferred Skills: {pref_str}. Role Overview: {job.description}"
        )
        unigrams = tokenize(text, remove_stopwords=True, stem=True)
        bigrams = extract_ngrams(unigrams, 2)
        chunks.append(
            RAGChunk(
                chunk_id=f"job-{job.id}",
                doc_id=job.id,
                title=f"Role: {job.title}",
                category="LIVE_JOB_ROLE",
                source_type="job_role",
                text=text,
                metadata={
                    "job_id": job.id,
                    "title": job.title,
                    "department": job.department,
                    "salary_band": job.salary_band,
                    "work_mode": job.work_mode,
                    "location": job.location,
                    "required_skills": job.required_skills or [],
                    "preferred_skills": job.preferred_skills or [],
                    "min_cgpa": job.min_cgpa,
                    "experience_min": job.experience_min,
                    "openings": job.openings,
                    "status": job.status,
                },
                tokens=unigrams + bigrams,
            )
        )

    # 3. Live Candidate Dossiers + Top Match Insights
    for cand in Candidate.objects.prefetch_related("matches__job_role").all():
        top_matches = sorted(
            list(cand.matches.all()), key=lambda m: m.overall_score, reverse=True
        )[:3]
        match_summary = "; ".join(
            f"{m.job_role.title}: {m.overall_score}% ({m.recommendation_tier})"
            for m in top_matches
        )
        proj_names = ", ".join(
            p.get("name", "") for p in (cand.projects or []) if isinstance(p, dict)
        )
        skills_str = ", ".join(cand.extracted_skills or [])
        text = (
            f"Candidate: {cand.full_name} ({cand.seniority_level}, Stage: {cand.pipeline_stage}). "
            f"Location: {cand.location}. Education: {cand.education} (CGPA: {cand.cgpa or 'N/A'}). "
            f"Experience: {cand.experience_years} years. ATS Score: {cand.ats_score}/100. "
            f"Assessment Score: {cand.assessment_score}/100. Skills: {skills_str}. "
            f"Projects: {proj_names}. Top Role Matches: {match_summary}. "
            f"Summary: {cand.screening_summary}"
        )
        unigrams = tokenize(text, remove_stopwords=True, stem=True)
        bigrams = extract_ngrams(unigrams, 2)
        chunks.append(
            RAGChunk(
                chunk_id=f"cand-{cand.id}",
                doc_id=cand.id,
                title=f"Candidate: {cand.full_name}",
                category="LIVE_CANDIDATE",
                source_type="candidate",
                text=text,
                metadata={
                    "candidate_id": cand.id,
                    "full_name": cand.full_name,
                    "pipeline_stage": cand.pipeline_stage,
                    "seniority_level": cand.seniority_level,
                    "cgpa": cand.cgpa,
                    "experience_years": cand.experience_years,
                    "ats_score": cand.ats_score,
                    "assessment_score": cand.assessment_score,
                    "skills": cand.extracted_skills or [],
                    "projects": cand.projects or [],
                    "top_matches": [
                        {
                            "role": m.job_role.title,
                            "score": m.overall_score,
                            "tier": m.recommendation_tier,
                            "missing": m.missing_required_skills,
                        }
                        for m in top_matches
                    ],
                },
                tokens=unigrams + bigrams,
            )
        )

    return chunks


def _detect_intent(query: str, mode: str = "auto") -> str:
    low = query.lower()
    if any(
        k in low
        for k in (
            "how many candidates", "pipeline", "funnel", "overview", "stats",
            "statistics", "shortlisted count", "hiring metrics", "breakdown",
        )
    ):
        return "pipeline_analytics"

    cand_signals = (
        "who ", "which candidate", "best candidate", "strongest candidate",
        "top candidate", "find candidate", "candidates with", "compare candidate",
        "shortlist", "applicant with", "dharshini", "resume of", "skill gap of",
    )
    if mode == "recruiter" and any(k in low for k in ("candidate", "talent", "match", "profile", "who", "skill")):
        return "candidate_search"
    if any(k in low for k in cand_signals):
        return "candidate_search"

    # Also check if query mentions an existing candidate's first name
    for name in Candidate.objects.values_list("full_name", flat=True):
        first = name.split()[0].lower()
        if len(first) >= 4 and re.search(rf"\b{re.escape(first)}\b", low):
            return "candidate_search"

    job_signals = (
        "openings", "open roles", "job role", "positions", "salary", "compensation",
        "ctc", "required skills for", "eligibility for", "backend engineer",
        "spring boot", "machine learning intern", "frontend react", "data analyst",
        "what jobs", "which roles", "vacancies",
    )
    if any(k in low for k in job_signals):
        # If specifically asking about interview/policy/benefits AND salary, allow hybrid
        if any(k in low for k in ("interview", "rounds", "policy", "benefits", "remote", "onboarding", "rubric")):
            return "hybrid_faq_job"
        return "role_info"

    return "applicant_faq"


def _hybrid_retrieve(
    query: str, chunks: list[RAGChunk], intent: str, top_k: int = 5
) -> list[tuple[RAGChunk, float]]:
    """Compute BM25 + TF-IDF Cosine Similarity + Intent Metadata Boosting."""
    if not chunks:
        return []

    q_unigrams = tokenize(query, remove_stopwords=True, stem=True)
    q_bigrams = extract_ngrams(q_unigrams, 2)
    query_tokens = q_unigrams + q_bigrams
    if not query_tokens:
        return [(c, 0.25) for c in chunks[:top_k]]

    N = len(chunks)
    doc_freqs: Counter[str] = Counter()
    doc_tfs: list[Counter[str]] = []
    doc_lens: list[int] = []

    for ch in chunks:
        tf = Counter(ch.tokens)
        doc_tfs.append(tf)
        doc_lens.append(len(ch.tokens))
        for term in tf:
            doc_freqs[term] += 1

    avgdl = sum(doc_lens) / max(1, N)
    k1 = 1.5
    b = 0.75

    # Query TF-IDF vector
    q_tf = Counter(query_tokens)
    q_vec: dict[str, float] = {}
    for term, cnt in q_tf.items():
        idf = math.log((N + 1) / (doc_freqs.get(term, 0) + 1)) + 1.0
        q_vec[term] = (1.0 + math.log(cnt)) * idf
    q_norm = math.sqrt(sum(v * v for v in q_vec.values())) or 1.0

    # Extract explicit technical skills mentioned in query for high-precision skill boosting
    query_skills, _ = extract_skills(query)
    query_skills_low = {s.lower() for s in query_skills}
    query_low = query.lower()

    raw_scores: list[tuple[int, float]] = []
    for idx, ch in enumerate(chunks):
        tf = doc_tfs[idx]
        dl = doc_lens[idx] or 1

        # BM25 score
        bm25 = 0.0
        for term in q_tf:
            f = tf.get(term, 0)
            if f == 0:
                continue
            df = doc_freqs[term]
            idf = math.log((N - df + 0.5) / (df + 0.5) + 1.0)
            bm25 += idf * (f * (k1 + 1.0)) / (f + k1 * (1.0 - b + b * (dl / avgdl)))

        # TF-IDF Cosine similarity
        dot = 0.0
        d_norm_sq = 0.0
        for term, cnt in tf.items():
            idf = math.log((N + 1) / (doc_freqs[term] + 1)) + 1.0
            w = (1.0 + math.log(cnt)) * idf
            d_norm_sq += w * w
            if term in q_vec:
                dot += w * q_vec[term]
        cosine = dot / (q_norm * (math.sqrt(d_norm_sq) or 1.0))

        # Exact phrase / title / skill match bonus
        title_bonus = 0.0
        title_tokens = set(tokenize(ch.title, remove_stopwords=True, stem=True))
        if title_tokens:
            overlap = len(title_tokens & set(q_unigrams)) / len(title_tokens)
            title_bonus = overlap * 0.45

        skill_bonus = 0.0
        if query_skills_low:
            if ch.source_type == "candidate":
                cand_skills_low = {s.lower() for s in ch.metadata.get("skills", [])}
                matched_cnt = len(query_skills_low & cand_skills_low)
                if matched_cnt:
                    skill_bonus = (matched_cnt / len(query_skills_low)) * 0.85
            elif ch.source_type == "job_role":
                job_skills_low = {
                    s.lower()
                    for s in (
                        ch.metadata.get("required_skills", [])
                        + ch.metadata.get("preferred_skills", [])
                    )
                }
                matched_cnt = len(query_skills_low & job_skills_low)
                if matched_cnt:
                    skill_bonus = (matched_cnt / len(query_skills_low)) * 0.65

        # Direct candidate name mention boost
        name_bonus = 0.0
        if ch.source_type == "candidate":
            cname = ch.metadata.get("full_name", "").lower()
            if cname and (cname in query_low or cname.split()[0] in query_low):
                name_bonus = 1.4

        # Intent source boost
        intent_mult = 1.0
        if intent == "candidate_search":
            intent_mult = 1.55 if ch.source_type == "candidate" else (0.95 if ch.source_type == "job_role" else 0.72)
        elif intent == "role_info":
            intent_mult = 1.55 if ch.source_type == "job_role" else (1.05 if ch.source_type == "knowledge" else 0.65)
        elif intent == "hybrid_faq_job":
            intent_mult = 1.35 if ch.source_type in ("knowledge", "job_role") else 0.65
        elif intent == "applicant_faq":
            intent_mult = 1.45 if ch.source_type == "knowledge" else (1.05 if ch.source_type == "job_role" else 0.60)

        # Normalize BM25 contribution smoothly via saturating curve
        bm25_norm = bm25 / (bm25 + 4.0) if bm25 > 0 else 0.0
        combined = (bm25_norm * 0.55 + cosine * 0.45 + title_bonus * 0.35 + skill_bonus + name_bonus) * intent_mult
        if combined > 0.01:
            raw_scores.append((idx, combined))

    raw_scores.sort(key=lambda item: item[1], reverse=True)
    if not raw_scores:
        return []

    max_score = raw_scores[0][1]
    results: list[tuple[RAGChunk, float]] = []
    seen_titles: set[str] = set()
    for idx, sc in raw_scores:
        ch = chunks[idx]
        # Avoid flooding with 4 chunks from the exact same document unless necessary
        key = f"{ch.source_type}:{ch.doc_id}"
        if key in seen_titles and len(results) >= 2:
            continue
        seen_titles.add(key)
        # Calibrated relevance score in [0.22, 0.99]
        rel = round(min(0.99, max(0.22, (sc / max(max_score, 0.85)) * 0.96)), 2)
        results.append((ch, rel))
        if len(results) >= top_k:
            break

    return results


def _synthesize_answer(
    query: str,
    intent: str,
    retrieved: list[tuple[RAGChunk, float]],
) -> tuple[str, list[str], float]:
    """Generate a rich, structured, context-grounded markdown answer with follow-ups."""
    if intent == "pipeline_analytics":
        total_cands = Candidate.objects.count()
        open_roles = JobRole.objects.filter(status="OPEN").count()
        stage_counts = {}
        for code, label in Candidate.STAGE_CHOICES:
            stage_counts[label] = Candidate.objects.filter(pipeline_stage=code).count()
        top_evals = list(MatchEvaluation.objects.select_related("candidate", "job_role")[:3])
        stage_lines = "\n".join(f"- **{lbl}**: {cnt} candidate(s)" for lbl, cnt in stage_counts.items() if cnt > 0)
        match_lines = "\n".join(
            f"- **{ev.candidate.full_name}** → *{ev.job_role.title}*: **{ev.overall_score}%** (`{ev.recommendation_tier}`)"
            for ev in top_evals
        )
        answer = (
            f"### Live Recruitment Pipeline Snapshot\n\n"
            f"TalentLens AI is currently tracking **{total_cands} candidates** across **{open_roles} open job roles**.\n\n"
            f"**Funnel Breakdown:**\n{stage_lines}\n\n"
            f"**Highest Ranked Skill-to-Role Matches:**\n{match_lines}\n\n"
            f"*Grounded directly from live Django recruitment records.*"
        )
        follow_ups = [
            "Who are the strongest candidates for AI/NLP Backend Engineer?",
            "Show all open roles and salary bands",
            "What is our technical screening rubric?",
        ]
        return answer, follow_ups, 0.96

    if not retrieved:
        return (
            "I couldn't find matching recruitment documents, job roles, or candidate records for that query yet. "
            "Try asking about **open roles**, **interview rounds**, **salary & benefits**, **candidate skills** (e.g., Django, NLP, Spring Boot, React), "
            "or add a new document in the **Knowledge Base Manager** on the right!",
            [
                "What are the interview rounds and timeline?",
                "Who are the strongest candidates with Django and NLP skills?",
                "List all open job roles and required skills",
            ],
            0.32,
        )

    top_rel = retrieved[0][1]
    query_skills, _ = extract_skills(query)

    if intent == "candidate_search":
        cand_hits = [(ch, sc) for ch, sc in retrieved if ch.source_type == "candidate"]
        if cand_hits:
            lines = []
            skill_note = f" matching **{', '.join(query_skills)}**" if query_skills else ""
            lines.append(f"### Top Retrieved Candidate Profiles{skill_note}\n")
            for idx, (ch, sc) in enumerate(cand_hits[:4], start=1):
                m = ch.metadata
                top_m = m["top_matches"][0] if m.get("top_matches") else None
                best_role_str = (
                    f"{top_m['role']} (**{top_m['score']}%**, `{top_m['tier']}`)"
                    if top_m
                    else "Pending evaluation"
                )
                skills_preview = ", ".join(m.get("skills", [])[:8])
                lines.append(
                    f"{idx}. **{m['full_name']}** — *{m['seniority_level']}* · Stage: `{m['pipeline_stage']}` · Relevance: `{int(sc * 100)}%`\n"
                    f"   - **ATS / Assessment**: {m['ats_score']}/100 · {m['assessment_score']}/100 · CGPA: {m.get('cgpa') or 'N/A'}\n"
                    f"   - **Verified Skills**: {skills_preview}\n"
                    f"   - **Best Role Match**: {best_role_str}"
                )
            lines.append(
                "\n*Tip: Open the **Skill-to-Role Matching** workspace to inspect full radar skill-gap charts or auto-shortlist candidates.*"
            )
            follow_ups = [
                f"Compare {cand_hits[0][0].metadata['full_name']} against open roles",
                "What is the technical screening rubric for shortlisting?",
                "Show recruitment pipeline funnel statistics",
            ]
            return "\n".join(lines), follow_ups, round(min(0.98, top_rel), 2)

    if intent in ("role_info", "hybrid_faq_job"):
        job_hits = [(ch, sc) for ch, sc in retrieved if ch.source_type == "job_role"]
        kb_hits = [(ch, sc) for ch, sc in retrieved if ch.source_type == "knowledge"]
        parts = []
        if job_hits:
            parts.append("### Open Job Roles & Requirements\n")
            for ch, sc in job_hits[:3]:
                m = ch.metadata
                req = ", ".join(m.get("required_skills", []))
                pref = ", ".join(m.get("preferred_skills", []))
                parts.append(
                    f"- **{m['title']}** (*{m['department']}* · `{m['work_mode']}` · {m['location']})\n"
                    f"  - **Compensation**: {m['salary_band']} · **Openings**: {m['openings']} · **Min Exp**: {m['experience_min']} yrs · **Min CGPA**: {m['min_cgpa']}\n"
                    f"  - **Required Skills**: {req}\n"
                    f"  - **Preferred Skills**: {pref}"
                )
        if kb_hits:
            parts.append("\n### Grounded Recruitment Policy & Process Details\n")
            for ch, sc in kb_hits[:2]:
                parts.append(f"**[{ch.title}]** *(relevance {int(sc * 100)}%)*\n{ch.text}")
        if parts:
            follow_ups = [
                "What are the interview rounds and expected timeline?",
                "Who are the top matched candidates for AI/NLP Backend Engineer?",
                "Tell me about campus hiring eligibility and CGPA cutoffs",
            ]
            return "\n\n".join(parts), follow_ups, round(min(0.97, top_rel), 2)

    # Default Applicant FAQ / Policy grounded synthesis
    kb_hits = [(ch, sc) for ch, sc in retrieved if ch.source_type == "knowledge"]
    other_hits = [(ch, sc) for ch, sc in retrieved if ch.source_type != "knowledge"]
    primary_hits = kb_hits[:3] if kb_hits else other_hits[:3]

    lead = primary_hits[0][0]
    sections = [
        f"### {lead.title}\n\n{lead.text}"
    ]
    if len(primary_hits) > 1:
        sections.append("#### Additional Retrieved Context")
        for ch, sc in primary_hits[1:]:
            sections.append(f"- **{ch.title}** (`{ch.category}` · {int(sc * 100)}% match): {ch.text}")

    if kb_hits and other_hits and other_hits[0][1] >= 0.55:
        extra = other_hits[0][0]
        sections.append(f"**Related Live Record — {extra.title}:** {extra.text[:240]}...")

    follow_ups = [
        "What roles are currently open and what are their salary bands?",
        "How can applicants optimize their resume for ATS screening?",
        "Who are the strongest candidates with Python and Django skills?",
    ]
    avg_top = sum(sc for _, sc in primary_hits) / len(primary_hits)
    confidence = round(min(0.98, max(0.45, top_rel * 0.65 + avg_top * 0.35)), 2)
    return "\n\n".join(sections), follow_ups, confidence


def query_rag_chatbot(query: str, mode: str = "auto", top_k: int = 5) -> dict[str, Any]:
    """Run end-to-end hybrid RAG retrieval and grounded response synthesis."""
    chunks = _build_corpus_chunks()
    intent = _detect_intent(query, mode=mode)
    retrieved = _hybrid_retrieve(query, chunks, intent=intent, top_k=top_k)
    answer, follow_ups, confidence = _synthesize_answer(query, intent, retrieved)

    sources = [
        {
            "chunk_id": ch.chunk_id,
            "doc_id": ch.doc_id,
            "title": ch.title,
            "category": ch.category,
            "source_type": ch.source_type,
            "snippet": ch.text[:280] + ("..." if len(ch.text) > 280 else ""),
            "relevance_score": score,
        }
        for ch, score in retrieved
    ]

    return {
        "answer": answer,
        "intent": intent,
        "confidence": confidence,
        "retrieved_sources": sources,
        "follow_ups": follow_ups,
        "indexed_chunks_count": len(chunks),
    }
