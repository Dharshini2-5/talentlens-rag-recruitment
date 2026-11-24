"""Skill-to-Role Matching & Automated Shortlisting Pipeline for TalentLens AI.

Weighted scoring formula:
  - Required Skills Match:              45% (canonical + synonym normalization + adjacent credit)
  - Preferred Skills Match:             20%
  - Experience & Education Fit:         15%
  - Candidate Assessment & ATS Quality: 20%
"""

from __future__ import annotations

from typing import Iterable

from .models import Candidate, JobRole, MatchEvaluation
from .nlp_parser import SKILL_TO_CATEGORY, normalize_skill, simple_stem, tokenize


def _canonical_set(skills: Iterable[str]) -> dict[str, str]:
    """Return mapping of normalized lowercase key -> display canonical skill."""
    out: dict[str, str] = {}
    for s in skills or []:
        norm = normalize_skill(str(s))
        if norm:
            out[norm.lower()] = norm
    return out


def _stem_overlap(skill_a: str, skill_b: str) -> bool:
    stems_a = set(tokenize(skill_a, remove_stopwords=True, stem=True))
    stems_b = set(tokenize(skill_b, remove_stopwords=True, stem=True))
    if not stems_a or not stems_b:
        return False
    inter = stems_a & stems_b
    return len(inter) / max(len(stems_a), len(stems_b)) >= 0.75


def _skill_match_status(target_skill: str, candidate_map: dict[str, str], candidate_categories: set[str]) -> str:
    """Return 'exact', 'adjacent', or 'missing' for a required/preferred skill."""
    norm_target = normalize_skill(target_skill)
    low = norm_target.lower()
    if low in candidate_map:
        return "exact"
    for cand_display in candidate_map.values():
        if _stem_overlap(norm_target, cand_display):
            return "exact"
    cat = SKILL_TO_CATEGORY.get(norm_target)
    if cat and cat in candidate_categories:
        return "adjacent"
    return "missing"


def compute_match_metrics(candidate: Candidate, job_role: JobRole) -> dict:
    """Compute structured skill-to-role match scores, gaps, tier, and rationale."""
    cand_map = _canonical_set(candidate.extracted_skills)
    cand_categories = {
        SKILL_TO_CATEGORY.get(v) for v in cand_map.values() if SKILL_TO_CATEGORY.get(v)
    }

    req_skills = [normalize_skill(s) for s in (job_role.required_skills or []) if str(s).strip()]
    pref_skills = [normalize_skill(s) for s in (job_role.preferred_skills or []) if str(s).strip()]

    matched_skills: list[str] = []
    missing_required: list[str] = []
    missing_preferred: list[str] = []

    # 1. Required Skills Match (45%)
    req_points = 0.0
    for skill in req_skills:
        status = _skill_match_status(skill, cand_map, cand_categories)
        if status == "exact":
            req_points += 1.0
            if skill not in matched_skills:
                matched_skills.append(skill)
        elif status == "adjacent":
            req_points += 0.22
            missing_required.append(skill)
        else:
            missing_required.append(skill)

    required_match_pct = (
        round((req_points / len(req_skills)) * 100.0, 1) if req_skills else 100.0
    )

    # 2. Preferred Skills Match (20%)
    pref_points = 0.0
    for skill in pref_skills:
        status = _skill_match_status(skill, cand_map, cand_categories)
        if status == "exact":
            pref_points += 1.0
            if skill not in matched_skills:
                matched_skills.append(skill)
        elif status == "adjacent":
            pref_points += 0.15
            missing_preferred.append(skill)
        else:
            missing_preferred.append(skill)

    preferred_match_pct = (
        round((pref_points / len(pref_skills)) * 100.0, 1) if pref_skills else 100.0
    )

    # 3. Experience & Education Fit (15%)
    req_exp = max(0.0, float(job_role.experience_min or 0.0))
    cand_exp = max(0.0, float(candidate.experience_years or 0.0))
    if req_exp <= 0.1:
        exp_component = 100.0 if cand_exp <= 4.0 else 92.0
    elif cand_exp >= req_exp:
        exp_component = 100.0
    else:
        exp_component = max(35.0, (cand_exp / req_exp) * 100.0)

    min_cgpa = float(job_role.min_cgpa or 6.5)
    cand_cgpa = candidate.cgpa
    if cand_cgpa is None:
        cgpa_component = 78.0
    elif cand_cgpa >= min_cgpa:
        cgpa_component = min(100.0, 88.0 + (cand_cgpa - min_cgpa) * 6.0)
    else:
        cgpa_component = max(45.0, (cand_cgpa / min_cgpa) * 85.0)

    experience_score = round(exp_component * 0.65 + cgpa_component * 0.35, 1)

    # 4. Assessment & ATS Quality Insights (20%)
    assess = float(candidate.assessment_score or 75.0)
    ats = float(candidate.ats_score or 72.0)
    assessment_weighted_score = round(min(100.0, assess * 0.60 + ats * 0.40), 1)

    # Final Weighted Score
    overall_score = round(
        required_match_pct * 0.45
        + preferred_match_pct * 0.20
        + experience_score * 0.15
        + assessment_weighted_score * 0.20,
        1,
    )

    # Recommendation tier
    if overall_score >= 80.0 and len(missing_required) <= 1:
        tier = "STRONG_MATCH"
    elif overall_score >= 66.0:
        tier = "GOOD_FIT"
    elif overall_score >= 50.0:
        tier = "POTENTIAL"
    else:
        tier = "LOW_FIT"

    # Human-readable rationale
    matched_preview = ", ".join(matched_skills[:6]) if matched_skills else "foundational engineering skills"
    gap_note = (
        f"Key skill gaps to probe in technical rounds: {', '.join(missing_required[:4])}."
        if missing_required
        else "Covers all core required skills for this role."
    )
    tier_action = {
        "STRONG_MATCH": "Recommended for immediate shortlisting and fast-track technical interview.",
        "GOOD_FIT": "Strong shortlist candidate; validate minor skill gaps during screening.",
        "POTENTIAL": "Consider for talent pool or targeted coding assessment before advancing.",
        "LOW_FIT": "Significant required skill mismatch; better aligned with alternate openings.",
    }[tier]

    rationale = (
        f"Scored {overall_score}% overall for {job_role.title} ({required_match_pct}% required skills, "
        f"{preferred_match_pct}% preferred skills, {experience_score}% exp/CGPA fit). "
        f"Verified strengths in {matched_preview}. {gap_note} {tier_action}"
    )

    return {
        "overall_score": overall_score,
        "required_match_pct": required_match_pct,
        "preferred_match_pct": preferred_match_pct,
        "experience_score": experience_score,
        "assessment_weighted_score": assessment_weighted_score,
        "matched_skills": matched_skills,
        "missing_required_skills": missing_required,
        "missing_preferred_skills": missing_preferred,
        "recommendation_tier": tier,
        "rationale": rationale,
    }


def evaluate_candidate_for_role(candidate: Candidate, job_role: JobRole) -> MatchEvaluation:
    """Create or update MatchEvaluation for a (candidate, job_role) pair."""
    metrics = compute_match_metrics(candidate, job_role)
    evaluation, _ = MatchEvaluation.objects.update_or_create(
        candidate=candidate,
        job_role=job_role,
        defaults=metrics,
    )
    return evaluation


def evaluate_candidate_against_all_roles(candidate: Candidate) -> list[MatchEvaluation]:
    """Evaluate a candidate against all OPEN job roles (or all roles if none open)."""
    roles = list(JobRole.objects.filter(status="OPEN"))
    if not roles:
        roles = list(JobRole.objects.all())
    results = [evaluate_candidate_for_role(candidate, role) for role in roles]
    results.sort(key=lambda m: m.overall_score, reverse=True)
    return results


def evaluate_all_candidates_for_role(job_role: JobRole) -> list[MatchEvaluation]:
    """Re-run matching pipeline across all candidates for a given job role."""
    candidates = list(Candidate.objects.all())
    results = [evaluate_candidate_for_role(cand, job_role) for cand in candidates]
    results.sort(key=lambda m: m.overall_score, reverse=True)
    return results


def auto_shortlist_top_candidates(
    job_role: JobRole, top_n: int = 3, min_score: float = 68.0
) -> list[MatchEvaluation]:
    """Evaluate role and promote top N qualifying candidates to SHORTLISTED."""
    evaluations = evaluate_all_candidates_for_role(job_role)
    promoted: list[MatchEvaluation] = []
    for ev in evaluations:
        if len(promoted) >= top_n:
            break
        if ev.overall_score < min_score:
            continue
        cand = ev.candidate
        if cand.pipeline_stage in ("NEW", "SCREENED"):
            cand.pipeline_stage = "SHORTLISTED"
            cand.save(update_fields=["pipeline_stage"])
        promoted.append(ev)
    return promoted
