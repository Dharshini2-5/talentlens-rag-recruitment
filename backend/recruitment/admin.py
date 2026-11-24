from django.contrib import admin
from .models import (
    Candidate,
    ChatMessage,
    ChatSession,
    JobRole,
    KnowledgeDocument,
    MatchEvaluation,
)

admin.site.register(JobRole)
admin.site.register(Candidate)
admin.site.register(MatchEvaluation)
admin.site.register(KnowledgeDocument)
admin.site.register(ChatSession)
admin.site.register(ChatMessage)
