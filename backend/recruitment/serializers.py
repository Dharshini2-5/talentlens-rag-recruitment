from rest_framework import serializers

from .models import (
    Candidate,
    ChatMessage,
    ChatSession,
    JobRole,
    KnowledgeDocument,
    MatchEvaluation,
)


class JobRoleSerializer(serializers.ModelSerializer):
    match_count = serializers.SerializerMethodField()
    strong_match_count = serializers.SerializerMethodField()
    top_match_score = serializers.SerializerMethodField()

    class Meta:
        model = JobRole
        fields = [
            "id",
            "title",
            "department",
            "location",
            "work_mode",
            "experience_min",
            "salary_band",
            "description",
            "required_skills",
            "preferred_skills",
            "min_cgpa",
            "openings",
            "status",
            "created_at",
            "match_count",
            "strong_match_count",
            "top_match_score",
        ]

    def get_match_count(self, obj: JobRole) -> int:
        return obj.matches.count()

    def get_strong_match_count(self, obj: JobRole) -> int:
        return obj.matches.filter(recommendation_tier__in=["STRONG_MATCH", "GOOD_FIT"]).count()

    def get_top_match_score(self, obj: JobRole) -> float:
        top = obj.matches.order_by("-overall_score").first()
        return round(top.overall_score, 1) if top else 0.0


class MatchEvaluationCompactSerializer(serializers.ModelSerializer):
    job_role_title = serializers.CharField(source="job_role.title", read_only=True)
    job_department = serializers.CharField(source="job_role.department", read_only=True)
    candidate_name = serializers.CharField(source="candidate.full_name", read_only=True)
    candidate_stage = serializers.CharField(source="candidate.pipeline_stage", read_only=True)
    candidate_seniority = serializers.CharField(source="candidate.seniority_level", read_only=True)
    candidate_ats_score = serializers.FloatField(source="candidate.ats_score", read_only=True)
    candidate_assessment_score = serializers.FloatField(source="candidate.assessment_score", read_only=True)
    candidate_cgpa = serializers.FloatField(source="candidate.cgpa", read_only=True)
    candidate_experience_years = serializers.FloatField(source="candidate.experience_years", read_only=True)
    candidate_skills = serializers.JSONField(source="candidate.extracted_skills", read_only=True)

    class Meta:
        model = MatchEvaluation
        fields = [
            "id",
            "candidate",
            "candidate_name",
            "candidate_stage",
            "candidate_seniority",
            "candidate_ats_score",
            "candidate_assessment_score",
            "candidate_cgpa",
            "candidate_experience_years",
            "candidate_skills",
            "job_role",
            "job_role_title",
            "job_department",
            "overall_score",
            "required_match_pct",
            "preferred_match_pct",
            "experience_score",
            "assessment_weighted_score",
            "matched_skills",
            "missing_required_skills",
            "missing_preferred_skills",
            "recommendation_tier",
            "rationale",
            "evaluated_at",
        ]


class CandidateSerializer(serializers.ModelSerializer):
    top_matches = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "location",
            "linkedin_url",
            "github_url",
            "education",
            "cgpa",
            "experience_years",
            "seniority_level",
            "raw_resume_text",
            "resume_filename",
            "extracted_skills",
            "skill_categories",
            "certifications",
            "projects",
            "ats_score",
            "ats_feedback",
            "screening_summary",
            "pipeline_stage",
            "assessment_score",
            "created_at",
            "top_matches",
        ]

    def get_top_matches(self, obj: Candidate) -> list[dict]:
        matches = obj.matches.select_related("job_role").order_by("-overall_score")[:5]
        return [
            {
                "id": m.id,
                "job_role": m.job_role_id,
                "job_role_title": m.job_role.title,
                "overall_score": m.overall_score,
                "required_match_pct": m.required_match_pct,
                "preferred_match_pct": m.preferred_match_pct,
                "experience_score": m.experience_score,
                "assessment_weighted_score": m.assessment_weighted_score,
                "matched_skills": m.matched_skills,
                "missing_required_skills": m.missing_required_skills,
                "missing_preferred_skills": m.missing_preferred_skills,
                "recommendation_tier": m.recommendation_tier,
                "rationale": m.rationale,
            }
            for m in matches
        ]


class KnowledgeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeDocument
        fields = [
            "id",
            "title",
            "category",
            "content",
            "tags",
            "chunk_count",
            "updated_at",
        ]


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "role",
            "content",
            "retrieved_sources",
            "confidence",
            "follow_ups",
            "created_at",
        ]


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ["id", "session_id", "mode", "created_at", "updated_at", "messages"]
