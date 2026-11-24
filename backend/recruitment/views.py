"""REST API Views for TalentLens AI Recruitment Assistant."""

from __future__ import annotations

import uuid
from collections import Counter

from django.db.models import Avg
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .matching_engine import (
    auto_shortlist_top_candidates,
    evaluate_all_candidates_for_role,
    evaluate_candidate_against_all_roles,
)
from .models import (
    Candidate,
    ChatMessage,
    ChatSession,
    JobRole,
    KnowledgeDocument,
    MatchEvaluation,
)
from .nlp_parser import extract_text_from_file, normalize_skill, parse_resume_text
from .rag_engine import chunk_document_text, query_rag_chatbot
from .serializers import (
    CandidateSerializer,
    ChatMessageSerializer,
    JobRoleSerializer,
    KnowledgeDocumentSerializer,
    MatchEvaluationCompactSerializer,
)


class HealthCheckView(APIView):
    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": "TalentLens AI Recruitment Assistant API",
                "engine": "Django + Pure-Python NLP Parser + Hybrid BM25/TF-IDF RAG",
                "counts": {
                    "jobs": JobRole.objects.count(),
                    "candidates": Candidate.objects.count(),
                    "matches": MatchEvaluation.objects.count(),
                    "knowledge_docs": KnowledgeDocument.objects.count(),
                },
            }
        )


class OverviewDashboardView(APIView):
    def get(self, request):
        candidates = list(Candidate.objects.all())
        jobs = list(JobRole.objects.all())
        open_jobs = [j for j in jobs if j.status == "OPEN"]
        matches = list(MatchEvaluation.objects.select_related("candidate", "job_role")[:10])

        avg_ats = Candidate.objects.aggregate(v=Avg("ats_score"))["v"] or 0.0
        avg_match = MatchEvaluation.objects.aggregate(v=Avg("overall_score"))["v"] or 0.0
        strong_matches = MatchEvaluation.objects.filter(
            recommendation_tier="STRONG_MATCH"
        ).count()
        shortlisted_count = Candidate.objects.filter(
            pipeline_stage__in=["SHORTLISTED", "INTERVIEW", "OFFER"]
        ).count()
        total_openings = sum(j.openings for j in open_jobs)
        total_kb_chunks = sum(
            KnowledgeDocument.objects.values_list("chunk_count", flat=True)
        )

        # Hiring Funnel distribution
        stage_order = [
            ("NEW", "New"),
            ("SCREENED", "Screened"),
            ("SHORTLISTED", "Shortlisted"),
            ("INTERVIEW", "Interview"),
            ("OFFER", "Offer"),
            ("REJECTED", "Rejected"),
        ]
        funnel = [
            {
                "stage": code,
                "label": label,
                "count": sum(1 for c in candidates if c.pipeline_stage == code),
            }
            for code, label in stage_order
        ]

        # Skill Demand (from Open Jobs) vs Skill Supply (from Candidates)
        demand_counter: Counter[str] = Counter()
        for j in open_jobs or jobs:
            for sk in j.required_skills or []:
                demand_counter[normalize_skill(sk)] += 2
            for sk in j.preferred_skills or []:
                demand_counter[normalize_skill(sk)] += 1

        supply_counter: Counter[str] = Counter()
        for c in candidates:
            for sk in set(c.extracted_skills or []):
                supply_counter[normalize_skill(sk)] += 1

        top_skills = [sk for sk, _ in demand_counter.most_common(10)]
        skill_gap_chart = [
            {
                "skill": sk,
                "demand": demand_counter[sk],
                "supply": supply_counter.get(sk, 0),
            }
            for sk in top_skills
        ]

        # Tier distribution
        tier_counts = {
            tier: MatchEvaluation.objects.filter(recommendation_tier=tier).count()
            for tier, _ in MatchEvaluation.TIER_CHOICES
        }

        return Response(
            {
                "kpis": {
                    "total_candidates": len(candidates),
                    "open_roles": len(open_jobs),
                    "total_openings": total_openings,
                    "shortlisted_candidates": shortlisted_count,
                    "strong_matches": strong_matches,
                    "avg_ats_score": round(avg_ats, 1),
                    "avg_match_score": round(avg_match, 1),
                    "knowledge_docs": KnowledgeDocument.objects.count(),
                    "indexed_rag_chunks": total_kb_chunks + len(jobs) + len(candidates),
                },
                "funnel": funnel,
                "skill_demand_vs_supply": skill_gap_chart,
                "tier_distribution": tier_counts,
                "top_matches": MatchEvaluationCompactSerializer(matches[:8], many=True).data,
            }
        )


class JobRoleListCreateView(APIView):
    def get(self, request):
        queryset = JobRole.objects.all()
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())
        return Response(JobRoleSerializer(queryset, many=True).data)

    def post(self, request):
        data = request.data.copy()
        if isinstance(data.get("required_skills"), str):
            data["required_skills"] = [
                normalize_skill(s)
                for s in data["required_skills"].split(",")
                if s.strip()
            ]
        if isinstance(data.get("preferred_skills"), str):
            data["preferred_skills"] = [
                normalize_skill(s)
                for s in data["preferred_skills"].split(",")
                if s.strip()
            ]
        serializer = JobRoleSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        job = serializer.save()
        evaluate_all_candidates_for_role(job)
        return Response(JobRoleSerializer(job).data, status=status.HTTP_201_CREATED)


class JobRoleDetailView(APIView):
    def get(self, request, pk: int):
        job = get_object_or_404(JobRole, pk=pk)
        return Response(JobRoleSerializer(job).data)

    def patch(self, request, pk: int):
        job = get_object_or_404(JobRole, pk=pk)
        serializer = JobRoleSerializer(job, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        job = serializer.save()
        evaluate_all_candidates_for_role(job)
        return Response(JobRoleSerializer(job).data)

    def delete(self, request, pk: int):
        job = get_object_or_404(JobRole, pk=pk)
        job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class JobRoleMatchAllView(APIView):
    def post(self, request, pk: int):
        job = get_object_or_404(JobRole, pk=pk)
        evaluations = evaluate_all_candidates_for_role(job)
        return Response(
            {
                "job_role": JobRoleSerializer(job).data,
                "evaluated_count": len(evaluations),
                "matches": MatchEvaluationCompactSerializer(evaluations, many=True).data,
            }
        )


class JobRoleAutoShortlistView(APIView):
    def post(self, request, pk: int):
        job = get_object_or_404(JobRole, pk=pk)
        top_n = int(request.data.get("top_n", 3))
        min_score = float(request.data.get("min_score", 68.0))
        promoted = auto_shortlist_top_candidates(job, top_n=top_n, min_score=min_score)
        all_evals = list(
            MatchEvaluation.objects.filter(job_role=job).select_related("candidate", "job_role")
        )
        return Response(
            {
                "job_role_id": job.id,
                "job_role_title": job.title,
                "shortlisted_count": len(promoted),
                "shortlisted": MatchEvaluationCompactSerializer(promoted, many=True).data,
                "matches": MatchEvaluationCompactSerializer(all_evals, many=True).data,
            }
        )


class CandidateListCreateView(APIView):
    def get(self, request):
        queryset = Candidate.objects.prefetch_related("matches__job_role").all()
        stage = request.query_params.get("stage")
        search = request.query_params.get("q")
        if stage:
            queryset = queryset.filter(pipeline_stage=stage.upper())
        if search:
            low = search.lower()
            queryset = [
                c
                for c in queryset
                if low in c.full_name.lower()
                or low in (c.education or "").lower()
                or any(low in s.lower() for s in (c.extracted_skills or []))
            ]
        return Response(CandidateSerializer(queryset, many=True).data)

    def post(self, request):
        serializer = CandidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        candidate = serializer.save()
        evaluate_candidate_against_all_roles(candidate)
        return Response(CandidateSerializer(candidate).data, status=status.HTTP_201_CREATED)


class CandidateParseResumeView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file") or request.FILES.get("resume")
        raw_text = request.data.get("resume_text") or request.data.get("text") or ""
        filename = request.data.get("filename") or "pasted_resume.txt"

        if uploaded_file is not None:
            try:
                raw_text, filename = extract_text_from_file(uploaded_file)
            except ValueError as exc:
                return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if not raw_text or len(raw_text.strip()) < 25:
            return Response(
                {
                    "error": "Please upload a valid .pdf, .docx, or .txt resume, or paste at least 25 characters of resume text."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        parsed = parse_resume_text(raw_text, filename=filename)

        # Optional overrides from form
        if request.data.get("full_name"):
            parsed["full_name"] = str(request.data["full_name"]).strip()
        if request.data.get("assessment_score"):
            try:
                parsed["assessment_score"] = float(request.data["assessment_score"])
            except (TypeError, ValueError):
                pass

        save_candidate = str(request.data.get("save", "true")).lower() != "false"
        if save_candidate:
            candidate = Candidate.objects.create(**parsed)
            evaluations = evaluate_candidate_against_all_roles(candidate)
            return Response(
                {
                    "candidate": CandidateSerializer(candidate).data,
                    "matches": MatchEvaluationCompactSerializer(evaluations, many=True).data,
                    "parsed_entities": {
                        "skills_count": len(parsed["extracted_skills"]),
                        "categories_count": len(parsed["skill_categories"]),
                        "projects_count": len(parsed["projects"]),
                        "certifications_count": len(parsed["certifications"]),
                        "ats_feedback": parsed["ats_feedback"],
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        return Response({"parsed": parsed}, status=status.HTTP_200_OK)


class CandidateDetailView(APIView):
    def get(self, request, pk: int):
        cand = get_object_or_404(Candidate, pk=pk)
        return Response(CandidateSerializer(cand).data)

    def patch(self, request, pk: int):
        cand = get_object_or_404(Candidate, pk=pk)
        serializer = CandidateSerializer(cand, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        cand = serializer.save()
        evaluate_candidate_against_all_roles(cand)
        return Response(CandidateSerializer(cand).data)

    def delete(self, request, pk: int):
        cand = get_object_or_404(Candidate, pk=pk)
        cand.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CandidateStageUpdateView(APIView):
    def patch(self, request, pk: int):
        cand = get_object_or_404(Candidate, pk=pk)
        new_stage = str(request.data.get("pipeline_stage") or request.data.get("stage") or "").upper()
        valid_stages = {code for code, _ in Candidate.STAGE_CHOICES}
        if new_stage not in valid_stages:
            return Response(
                {"error": f"Invalid stage '{new_stage}'. Valid stages: {sorted(valid_stages)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cand.pipeline_stage = new_stage
        cand.save(update_fields=["pipeline_stage"])
        return Response(CandidateSerializer(cand).data)


class MatchEvaluationListView(APIView):
    def get(self, request):
        queryset = MatchEvaluation.objects.select_related("candidate", "job_role").all()
        job_role_id = request.query_params.get("job_role")
        candidate_id = request.query_params.get("candidate")
        tier = request.query_params.get("tier")
        if job_role_id:
            queryset = queryset.filter(job_role_id=job_role_id)
        if candidate_id:
            queryset = queryset.filter(candidate_id=candidate_id)
        if tier:
            queryset = queryset.filter(recommendation_tier=tier.upper())
        return Response(MatchEvaluationCompactSerializer(queryset, many=True).data)


class KnowledgeDocumentListCreateView(APIView):
    def get(self, request):
        queryset = KnowledgeDocument.objects.all()
        category = request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category.upper())
        return Response(KnowledgeDocumentSerializer(queryset, many=True).data)

    def post(self, request):
        data = request.data.copy()
        if isinstance(data.get("tags"), str):
            data["tags"] = [t.strip() for t in data["tags"].split(",") if t.strip()]
        content = data.get("content", "")
        data["chunk_count"] = max(1, len(chunk_document_text(content)))
        serializer = KnowledgeDocumentSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        doc = serializer.save()
        return Response(KnowledgeDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)


class KnowledgeDocumentDetailView(APIView):
    def delete(self, request, pk: int):
        doc = get_object_or_404(KnowledgeDocument, pk=pk)
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatQueryView(APIView):
    def post(self, request):
        query = str(request.data.get("query") or request.data.get("message") or "").strip()
        if not query:
            return Response(
                {"error": "Please enter a question for TalentLens AI."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session_id = str(request.data.get("session_id") or "").strip() or f"session-{uuid.uuid4().hex[:10]}"
        mode = str(request.data.get("mode") or "auto").lower()
        top_k = min(8, max(2, int(request.data.get("top_k", 5))))

        session, _ = ChatSession.objects.get_or_create(
            session_id=session_id,
            defaults={"mode": mode},
        )
        if session.mode != mode:
            session.mode = mode
            session.save(update_fields=["mode", "updated_at"])

        user_msg = ChatMessage.objects.create(
            session=session,
            role="user",
            content=query,
        )

        rag_result = query_rag_chatbot(query=query, mode=mode, top_k=top_k)

        assistant_msg = ChatMessage.objects.create(
            session=session,
            role="assistant",
            content=rag_result["answer"],
            retrieved_sources=rag_result["retrieved_sources"],
            confidence=rag_result["confidence"],
            follow_ups=rag_result["follow_ups"],
        )

        return Response(
            {
                "session_id": session.session_id,
                "intent": rag_result["intent"],
                "confidence": rag_result["confidence"],
                "indexed_chunks_count": rag_result["indexed_chunks_count"],
                "user_message": ChatMessageSerializer(user_msg).data,
                "assistant_message": ChatMessageSerializer(assistant_msg).data,
                "answer": rag_result["answer"],
                "retrieved_sources": rag_result["retrieved_sources"],
                "follow_ups": rag_result["follow_ups"],
            }
        )


class ChatHistoryView(APIView):
    def get(self, request):
        session_id = request.query_params.get("session_id")
        if session_id:
            session = ChatSession.objects.filter(session_id=session_id).first()
            if not session:
                return Response({"session_id": session_id, "messages": []})
            return Response(
                {
                    "session_id": session.session_id,
                    "mode": session.mode,
                    "messages": ChatMessageSerializer(session.messages.all(), many=True).data,
                }
            )
        sessions = ChatSession.objects.all()[:10]
        return Response(
            [
                {
                    "session_id": s.session_id,
                    "mode": s.mode,
                    "message_count": s.messages.count(),
                    "updated_at": s.updated_at,
                }
                for s in sessions
            ]
        )
