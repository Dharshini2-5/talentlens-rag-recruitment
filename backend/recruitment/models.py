from django.db import models


class JobRole(models.Model):
    WORK_MODE_CHOICES = [
        ("Remote", "Remote"),
        ("Hybrid", "Hybrid"),
        ("Onsite", "Onsite"),
    ]
    STATUS_CHOICES = [
        ("OPEN", "Open"),
        ("PAUSED", "Paused"),
        ("CLOSED", "Closed"),
    ]

    title = models.CharField(max_length=200)
    department = models.CharField(max_length=120)
    location = models.CharField(max_length=120, default="Bengaluru, India")
    work_mode = models.CharField(max_length=20, choices=WORK_MODE_CHOICES, default="Hybrid")
    experience_min = models.FloatField(default=0.0)
    salary_band = models.CharField(max_length=120, default="₹8L – ₹14L / yr")
    description = models.TextField()
    required_skills = models.JSONField(default=list)
    preferred_skills = models.JSONField(default=list)
    min_cgpa = models.FloatField(default=6.5)
    openings = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="OPEN")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "title"]

    def __str__(self) -> str:
        return f"{self.title} ({self.department})"


class Candidate(models.Model):
    STAGE_CHOICES = [
        ("NEW", "New"),
        ("SCREENED", "Screened"),
        ("SHORTLISTED", "Shortlisted"),
        ("INTERVIEW", "Interview"),
        ("OFFER", "Offer"),
        ("REJECTED", "Rejected"),
    ]

    full_name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=40, blank=True, default="")
    location = models.CharField(max_length=120, blank=True, default="")
    linkedin_url = models.CharField(max_length=300, blank=True, default="")
    github_url = models.CharField(max_length=300, blank=True, default="")
    education = models.CharField(max_length=300, blank=True, default="")
    cgpa = models.FloatField(null=True, blank=True)
    experience_years = models.FloatField(default=0.0)
    seniority_level = models.CharField(max_length=50, default="Entry-Level")
    raw_resume_text = models.TextField(blank=True, default="")
    resume_filename = models.CharField(max_length=255, blank=True, default="")
    extracted_skills = models.JSONField(default=list)
    skill_categories = models.JSONField(default=dict)
    certifications = models.JSONField(default=list)
    projects = models.JSONField(default=list)
    ats_score = models.FloatField(default=0.0)
    ats_feedback = models.JSONField(default=dict)
    screening_summary = models.TextField(blank=True, default="")
    pipeline_stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default="NEW")
    assessment_score = models.FloatField(default=75.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.full_name} ({self.pipeline_stage})"


class MatchEvaluation(models.Model):
    TIER_CHOICES = [
        ("STRONG_MATCH", "Strong Match"),
        ("GOOD_FIT", "Good Fit"),
        ("POTENTIAL", "Potential"),
        ("LOW_FIT", "Low Fit"),
    ]

    candidate = models.ForeignKey(
        Candidate, on_delete=models.CASCADE, related_name="matches"
    )
    job_role = models.ForeignKey(
        JobRole, on_delete=models.CASCADE, related_name="matches"
    )
    overall_score = models.FloatField(default=0.0)
    required_match_pct = models.FloatField(default=0.0)
    preferred_match_pct = models.FloatField(default=0.0)
    experience_score = models.FloatField(default=0.0)
    assessment_weighted_score = models.FloatField(default=0.0)
    matched_skills = models.JSONField(default=list)
    missing_required_skills = models.JSONField(default=list)
    missing_preferred_skills = models.JSONField(default=list)
    recommendation_tier = models.CharField(
        max_length=20, choices=TIER_CHOICES, default="POTENTIAL"
    )
    rationale = models.TextField(blank=True, default="")
    evaluated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("candidate", "job_role")
        ordering = ["-overall_score", "-evaluated_at"]

    def __str__(self) -> str:
        return f"{self.candidate.full_name} -> {self.job_role.title} ({self.overall_score}%)"


class KnowledgeDocument(models.Model):
    CATEGORY_CHOICES = [
        ("POLICY", "Policy"),
        ("INTERVIEW_PROCESS", "Interview Process"),
        ("JOB_FAQ", "Job FAQ"),
        ("BENEFITS", "Benefits"),
        ("CULTURE", "Culture"),
        ("TECHNICAL_RUBRIC", "Technical Rubric"),
    ]

    title = models.CharField(max_length=255)
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default="POLICY")
    content = models.TextField()
    tags = models.JSONField(default=list)
    chunk_count = models.PositiveIntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "title"]

    def __str__(self) -> str:
        return f"[{self.category}] {self.title}"


class ChatSession(models.Model):
    session_id = models.CharField(max_length=100, unique=True)
    mode = models.CharField(max_length=30, default="auto")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return self.session_id


class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ("user", "User"),
        ("assistant", "Assistant"),
    ]

    session = models.ForeignKey(
        ChatSession, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    retrieved_sources = models.JSONField(default=list)
    confidence = models.FloatField(default=0.0)
    follow_ups = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self) -> str:
        return f"{self.session.session_id} [{self.role}]: {self.content[:50]}"
