from django.urls import path

from .views import (
    CandidateDetailView,
    CandidateListCreateView,
    CandidateParseResumeView,
    CandidateStageUpdateView,
    ChatHistoryView,
    ChatQueryView,
    HealthCheckView,
    JobRoleAutoShortlistView,
    JobRoleDetailView,
    JobRoleListCreateView,
    JobRoleMatchAllView,
    KnowledgeDocumentDetailView,
    KnowledgeDocumentListCreateView,
    MatchEvaluationListView,
    OverviewDashboardView,
)

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("overview/", OverviewDashboardView.as_view(), name="overview"),
    path("jobs/", JobRoleListCreateView.as_view(), name="jobs-list-create"),
    path("jobs/<int:pk>/", JobRoleDetailView.as_view(), name="jobs-detail"),
    path("jobs/<int:pk>/match-all/", JobRoleMatchAllView.as_view(), name="jobs-match-all"),
    path("jobs/<int:pk>/auto-shortlist/", JobRoleAutoShortlistView.as_view(), name="jobs-auto-shortlist"),
    path("candidates/", CandidateListCreateView.as_view(), name="candidates-list-create"),
    path("candidates/parse-resume/", CandidateParseResumeView.as_view(), name="candidates-parse-resume"),
    path("candidates/<int:pk>/", CandidateDetailView.as_view(), name="candidates-detail"),
    path("candidates/<int:pk>/stage/", CandidateStageUpdateView.as_view(), name="candidates-stage"),
    path("matches/", MatchEvaluationListView.as_view(), name="matches-list"),
    path("knowledge/", KnowledgeDocumentListCreateView.as_view(), name="knowledge-list-create"),
    path("knowledge/<int:pk>/", KnowledgeDocumentDetailView.as_view(), name="knowledge-detail"),
    path("chat/query/", ChatQueryView.as_view(), name="chat-query"),
    path("chat/history/", ChatHistoryView.as_view(), name="chat-history"),
]
