"""Idempotent management command to seed realistic TalentLens AI recruitment data."""

from django.core.management.base import BaseCommand

from recruitment.matching_engine import evaluate_candidate_against_all_roles
from recruitment.models import Candidate, JobRole, KnowledgeDocument
from recruitment.nlp_parser import parse_resume_text
from recruitment.rag_engine import chunk_document_text


SEED_JOBS = [
    {
        "title": "AI/NLP Backend Engineer",
        "department": "Applied AI & Platform",
        "location": "Bengaluru, India",
        "work_mode": "Hybrid",
        "experience_min": 0.0,
        "salary_band": "₹10L – ₹16L / yr",
        "description": (
            "Build intelligent Django REST APIs, NLP resume/document parsing pipelines, "
            "and hybrid RAG chatbots powering next-generation enterprise hiring workflows."
        ),
        "required_skills": [
            "Python", "Django", "Django REST Framework", "NLP", "RAG", "REST APIs", "SQL", "Git"
        ],
        "preferred_skills": [
            "Machine Learning", "PostgreSQL", "React", "Docker", "TF-IDF", "BM25"
        ],
        "min_cgpa": 7.0,
        "openings": 3,
        "status": "OPEN",
    },
    {
        "title": "Full-Stack Spring Boot Developer",
        "department": "Core Engineering",
        "location": "Chennai, India",
        "work_mode": "Hybrid",
        "experience_min": 1.0,
        "salary_band": "₹9L – ₹15L / yr",
        "description": (
            "Design scalable Java Spring Boot microservices paired with modern React dashboards, "
            "high-throughput relational databases, and automated CI/CD pipelines."
        ),
        "required_skills": [
            "Java", "Spring Boot", "React", "REST APIs", "SQL", "PostgreSQL", "OOP"
        ],
        "preferred_skills": [
            "TypeScript", "Docker", "Microservices", "JWT", "AWS", "Tailwind CSS"
        ],
        "min_cgpa": 7.0,
        "openings": 4,
        "status": "OPEN",
    },
    {
        "title": "Machine Learning Intern",
        "department": "Applied AI Research",
        "location": "Bengaluru, India",
        "work_mode": "Remote",
        "experience_min": 0.0,
        "salary_band": "₹35K – ₹55K / mo (PPO Eligible)",
        "description": (
            "Collaborate with ML engineers on predictive modeling, NLP extraction, feature engineering, "
            "and LLM evaluation benchmarks with a clear path to full-time conversion."
        ),
        "required_skills": [
            "Python", "Machine Learning", "Scikit-learn", "Pandas", "NumPy", "NLP"
        ],
        "preferred_skills": [
            "PyTorch", "Deep Learning", "RAG", "Transformers", "Hugging Face", "Git"
        ],
        "min_cgpa": 7.5,
        "openings": 5,
        "status": "OPEN",
    },
    {
        "title": "Frontend React Engineer",
        "department": "Product Experience",
        "location": "Hyderabad, India",
        "work_mode": "Remote",
        "experience_min": 1.0,
        "salary_band": "₹8L – ₹14L / yr",
        "description": (
            "Craft ultra-responsive, animated React & TypeScript interfaces, interactive data visualizations, "
            "and accessible design systems for SaaS analytics products."
        ),
        "required_skills": [
            "JavaScript", "React", "HTML", "CSS", "Tailwind CSS", "REST APIs", "Git"
        ],
        "preferred_skills": [
            "TypeScript", "Next.js", "Vite", "Framer Motion", "Redux", "GraphQL"
        ],
        "min_cgpa": 6.5,
        "openings": 2,
        "status": "OPEN",
    },
    {
        "title": "Data & SQL Analyst",
        "department": "Business Intelligence",
        "location": "Pune, India",
        "work_mode": "Onsite",
        "experience_min": 0.5,
        "salary_band": "₹7L – ₹12L / yr",
        "description": (
            "Transform multi-source operational datasets into executive KPIs, predictive cohort models, "
            "and automated SQL/BI reporting pipelines."
        ),
        "required_skills": [
            "SQL", "Python", "Data Analysis", "Pandas", "Power BI", "PostgreSQL"
        ],
        "preferred_skills": [
            "Tableau", "MySQL", "Predictive Analytics", "NumPy", "Machine Learning", "Statistical Modeling"
        ],
        "min_cgpa": 6.8,
        "openings": 3,
        "status": "OPEN",
    },
]


SEED_CANDIDATES = [
    {
        "email": "dharshini.a@talentlens.dev",
        "stage": "SHORTLISTED",
        "assessment_score": 93.5,
        "filename": "Dharshini_A_Resume.pdf",
        "resume_text": """Dharshini A
Coimbatore, India | dharshini.a@talentlens.dev | +91 98401 44210
https://linkedin.com/in/dharshini-a-dev | https://github.com/dharshini-a

SUMMARY
Final-year Computer Science Engineering student specializing in AI-driven web applications, Django NLP pipelines, Spring Boot microservices, and predictive analytics. Passionate about building production-ready full-stack systems with measurable impact.

EDUCATION
B.E. in Computer Science and Engineering, Anna University Affiliated College — CGPA: 8.85 / 10 (2022 - 2026)

TECHNICAL SKILLS
Languages: Python, Java, JavaScript, SQL, HTML, CSS
Frameworks: Django, Django REST Framework, Spring Boot, React, Tailwind CSS, REST APIs
Databases: PostgreSQL, MySQL, SQLite
AI/ML/NLP: Machine Learning, NLP, RAG, TF-IDF, BM25, Scikit-learn, Pandas, NumPy, Predictive Analytics, Data Analysis
Tools & Core CS: Git, GitHub, Docker, Data Structures & Algorithms, OOP, DBMS, Operating Systems, System Design

EXPERIENCE
Software Engineering Intern — InnovateTech Labs (May 2025 - Aug 2025)
- Built Django REST Framework backend microservices and automated NLP screening endpoints reducing manual triage effort by 42%.
- Optimized PostgreSQL queries and indexing strategies improving dashboard API latency by 35%.

PROJECTS
Recruitment Assistant with Smart Chatbot (TalentLens AI) | Django, NLP, RAG, React, PostgreSQL
- Developed an AI-driven recruitment platform using Django and NLP-based resume parsing to automate candidate profiling and preliminary screening workflows with 94% extraction accuracy.
- Built a RAG-based chatbot using BM25 + TF-IDF retrieval to handle applicant queries and streamline candidate interactions.
- Designed weighted skill-to-role matching pipelines improving shortlisting precision by 38%.

Placement Readiness Analytics & Skill-Gap Dashboard | Spring Boot, React, MySQL, Predictive Analytics
- Engineered full-stack placement readiness tracking platform analyzing academic, DSA, and mock interview metrics for 500+ students.
- Implemented predictive readiness scoring and personalized skill-gap recommendations.

CERTIFICATIONS
- NPTEL Elite Gold Certification in Python for Data Science
- AWS Certified Cloud Practitioner
- HackerRank 5-Star Problem Solving & SQL Gold Badge
""",
    },
    {
        "email": "arjun.karthikeyan@talentlens.dev",
        "stage": "INTERVIEW",
        "assessment_score": 89.0,
        "filename": "Arjun_Karthikeyan_CV.pdf",
        "resume_text": """Arjun Karthikeyan
Chennai, India | arjun.karthikeyan@talentlens.dev | +91 98842 11904
https://linkedin.com/in/arjun-karthikeyan | https://github.com/arjunk-dev

SUMMARY
Full-Stack Software Engineer with 2.5 years of experience architecting high-availability Java Spring Boot microservices and TypeScript/React enterprise portals.

EDUCATION
B.Tech in Information Technology, VIT Vellore — CGPA: 8.4 / 10

TECHNICAL SKILLS
Java, Spring Boot, Hibernate, JPA, React, TypeScript, JavaScript, REST APIs, Microservices, PostgreSQL, MySQL, Redis, Docker, AWS, CI/CD, Git, GitHub Actions, JWT, OAuth2, OOP, System Design, Tailwind CSS, JUnit

EXPERIENCE
Software Engineer — FinEdge Systems (Jul 2023 - Present)
- Designed 12 Spring Boot microservices processing 80,000+ daily payment reconciliation records with 99.95% uptime.
- Led frontend migration to React + TypeScript + Tailwind CSS improving page load performance by 40%.

PROJECTS
Distributed Order Orchestration Engine | Java, Spring Boot, PostgreSQL, Redis, Docker
- Built resilient event-driven order workflow with JWT auth, idempotent retries, and Grafana observability dashboards.

Real-Time Team Sprint Telemetry Portal | React, TypeScript, Spring Boot, WebSockets
- Created interactive velocity and burndown visualizations serving 250 internal engineers.

CERTIFICATIONS
- Oracle Certified Professional: Java SE Developer
- AWS Certified Developer Associate
""",
    },
    {
        "email": "meera.subramanian@talentlens.dev",
        "stage": "SHORTLISTED",
        "assessment_score": 91.5,
        "filename": "Meera_Subramanian_NLP.docx",
        "resume_text": """Meera Subramanian
Bengaluru, India | meera.subramanian@talentlens.dev | +91 99012 77831
https://linkedin.com/in/meera-subramanian-ai | https://github.com/meera-nlp

SUMMARY
Applied AI & NLP Engineer with 1.5 years of hands-on experience building RAG assistants, transformer fine-tuning pipelines, and FastAPI/Django ML services.

EDUCATION
M.Tech in Data Science & AI, IIIT Bengaluru — CGPA: 9.1 / 10

TECHNICAL SKILLS
Python, Machine Learning, Deep Learning, NLP, RAG, LLMs, LangChain, PyTorch, Transformers, Hugging Face, Scikit-learn, Pandas, NumPy, TF-IDF, BM25, Vector Databases, FAISS, Django, Django REST Framework, FastAPI, PostgreSQL, Docker, Git, REST APIs, SQL

EXPERIENCE
ML Engineer — CognitiveWorks AI (Jun 2024 - Present)
- Engineered hybrid BM25 + dense vector RAG knowledge assistants answering 15,000+ monthly enterprise queries with 92% grounded faithfulness.
- Deployed Django and FastAPI inference APIs containerized with Docker reducing p95 response latency to 210ms.

PROJECTS
Clinical Document NER & Summarization Pipeline | Python, PyTorch, Hugging Face, NLP
- Fine-tuned domain transformer achieving 91.4% F1 on entity extraction across 40,000 medical notes.

Multi-Document RAG Research Assistant | Python, RAG, LangChain, FAISS, Django
- Built citation-backed QA assistant with automated evaluation metrics and live document chunking.

CERTIFICATIONS
- Coursera Deep Learning Specialization (Andrew Ng)
- Google Cloud Machine Learning Engineer Certificate
""",
    },
    {
        "email": "rohan.deshmukh@talentlens.dev",
        "stage": "INTERVIEW",
        "assessment_score": 86.5,
        "filename": "Rohan_Deshmukh_Frontend.pdf",
        "resume_text": """Rohan Deshmukh
Hyderabad, India | rohan.deshmukh@talentlens.dev | +91 97654 22198
https://linkedin.com/in/rohan-deshmukh-ui | https://github.com/rohand-ui

SUMMARY
Product-focused Frontend Engineer with 2 years of experience crafting high-craft React, Next.js, and TypeScript applications with smooth motion choreography.

EDUCATION
B.E. in Computer Engineering, Pune Institute of Computer Technology — CGPA: 8.1 / 10

TECHNICAL SKILLS
JavaScript, TypeScript, React, Next.js, Vite, Tailwind CSS, HTML, CSS, Framer Motion, Redux, GraphQL, REST APIs, Node.js, Git, GitHub, Vercel, Unit Testing, Web Security, Performance Optimization

EXPERIENCE
Frontend Engineer — PixelCraft SaaS (Aug 2023 - Present)
- Architected modular React + TypeScript component library adopted across 4 flagship analytics apps, cutting UI defects by 50%.
- Optimized bundle splitting with Vite and memoized virtualized tables lifting Lighthouse performance score to 98%.

PROJECTS
Kinetic Design System & Motion Playground | React, TypeScript, Tailwind CSS, Framer Motion
- Authored 35+ accessible interactive primitives with dark-mode tokens and storybook documentation.

SaaS Revenue Explorer Dashboard | Next.js, GraphQL, TypeScript, Tailwind CSS
- Delivered real-time cohort filtering and interactive drill-down charts for 12,000+ B2B users.

CERTIFICATIONS
- Meta Frontend Developer Professional Certificate
""",
    },
    {
        "email": "sneha.nair@talentlens.dev",
        "stage": "SCREENED",
        "assessment_score": 84.0,
        "filename": "Sneha_Nair_Analytics.pdf",
        "resume_text": """Sneha Nair
Pune, India | sneha.nair@talentlens.dev | +91 98230 66512
https://linkedin.com/in/sneha-nair-data | https://github.com/snehanair-bi

SUMMARY
Detail-oriented Data & SQL Analyst with 1.2 years of experience converting complex relational data into actionable Power BI, Tableau, and Python predictive insights.

EDUCATION
B.Sc in Data Science & Statistics, Fergusson College Pune — CGPA: 8.6 / 10

TECHNICAL SKILLS
SQL, PostgreSQL, MySQL, Python, Pandas, NumPy, Data Analysis, Predictive Analytics, Statistical Modeling, Feature Engineering, Power BI, Tableau, Scikit-learn, Machine Learning, Git, DBMS

EXPERIENCE
Junior Data Analyst — MetricPulse Retail (Jul 2024 - Present)
- Wrote automated PostgreSQL analytical pipelines and executive Power BI dashboards tracking $4M monthly GMV across 18 regions.
- Built customer churn prediction model in Scikit-learn improving retention campaign ROI by 22%.

PROJECTS
E-Commerce Funnel & Cohort Intelligence Suite | SQL, PostgreSQL, Power BI, Python
- Automated cohort retention queries and anomaly alerts reducing manual analyst reporting time by 65%.

Supply Chain Demand Forecaster | Python, Pandas, Scikit-learn, Tableau
- Implemented seasonal time-series forecasting across 1,200 SKUs reducing stockout rate by 18%.

CERTIFICATIONS
- Microsoft Certified: Power BI Data Analyst Associate
- HackerRank SQL Advanced Certification
""",
    },
    {
        "email": "vikram.rao@talentlens.dev",
        "stage": "OFFER",
        "assessment_score": 92.0,
        "filename": "Vikramaditya_Rao_Backend.pdf",
        "resume_text": """Vikramaditya Rao
Bengaluru, India | vikram.rao@talentlens.dev | +91 96115 33902
https://linkedin.com/in/vikramaditya-rao | https://github.com/vikramrao-sys

SUMMARY
Backend & AI Infrastructure Engineer with 3 years of experience scaling Python Django APIs, NLP data ingestion services, and cloud-native AWS deployments.

EDUCATION
B.Tech in Computer Science, NIT Surathkal — CGPA: 8.7 / 10

TECHNICAL SKILLS
Python, Django, Django REST Framework, FastAPI, PostgreSQL, Redis, SQL, NLP, RAG, Machine Learning, REST APIs, Microservices, Docker, Kubernetes, AWS, CI/CD, Linux, Git, PyTest, System Design, Data Structures & Algorithms

EXPERIENCE
Backend Software Engineer — CloudScale Talent (May 2023 - Present)
- Owned Django REST APIs handling 1.2M monthly candidate assessments with sub-120ms median latency.
- Implemented Celery + Redis asynchronous NLP parsing queues cutting resume ingestion latency by 70%.

PROJECTS
High-Throughput Document Search & RAG Service | Python, Django, BM25, PostgreSQL, Docker
- Built hybrid lexical + semantic search API indexed over 200,000 technical manuals with automated regression tests.

CERTIFICATIONS
- AWS Certified Solutions Architect Associate
""",
    },
    {
        "email": "ananya.iyer@talentlens.dev",
        "stage": "NEW",
        "assessment_score": 81.5,
        "filename": "Ananya_Iyer_ML_Intern.docx",
        "resume_text": """Ananya Iyer
Bengaluru, India | ananya.iyer@talentlens.dev | +91 94480 51923
https://linkedin.com/in/ananya-iyer-ml | https://github.com/ananyaiyer-ai

SUMMARY
Pre-final year B.Tech Artificial Intelligence & Data Science undergraduate seeking a Machine Learning Internship to apply NLP, PyTorch, and Scikit-learn modeling skills.

EDUCATION
B.Tech in Artificial Intelligence & Data Science, PES University — CGPA: 8.95 / 10

TECHNICAL SKILLS
Python, Machine Learning, Deep Learning, NLP, PyTorch, TensorFlow, Scikit-learn, Pandas, NumPy, OpenCV, Hugging Face, Feature Engineering, SQL, Git, GitHub, Data Structures & Algorithms

EXPERIENCE
Undergraduate Research Intern — PES AI Lab (Jan 2025 - May 2025)
- Built sentiment analysis and named entity recognition models over 25,000 multilingual product reviews improving macro-F1 by 9%.

PROJECTS
Smart Resume Skill Extractor & Topic Classifier | Python, NLP, Scikit-learn, TF-IDF, Pandas
- Trained multi-label classifier categorizing technical resumes into 12 engineering tracks with 89% accuracy.

Road Sign Detection with Lightweight CNNs | Python, PyTorch, OpenCV, Deep Learning
- Achieved 96.2% validation accuracy at 45 FPS on edge hardware.

CERTIFICATIONS
- Coursera Machine Learning Specialization
- NPTEL Deep Learning Silver Medal
""",
    },
    {
        "email": "karthik.menon@talentlens.dev",
        "stage": "SCREENED",
        "assessment_score": 78.5,
        "filename": "Karthik_Menon_Fullstack.txt",
        "resume_text": """Karthik Menon
Kochi, India | karthik.menon@talentlens.dev | +91 98951 44019
https://linkedin.com/in/karthik-menon-js | https://github.com/karthikmenon-fs

SUMMARY
Full-Stack JavaScript Developer with 1.5 years of experience delivering responsive React frontends and Node.js / Express.js REST APIs.

EDUCATION
B.Tech in Computer Science, CUSAT Kochi — CGPA: 7.75 / 10

TECHNICAL SKILLS
JavaScript, TypeScript, React, Node.js, Express.js, MongoDB, PostgreSQL, HTML, CSS, Tailwind CSS, REST APIs, Docker, Git, GitHub, Postman, Agile, JWT

EXPERIENCE
Software Developer — WebNova Digital (Jan 2024 - Present)
- Built customer self-service dashboards using React, Tailwind CSS, and Node.js serving 30,000 monthly active users.
- Integrated JWT authentication and automated Postman contract test suites.

PROJECTS
Collaborative Kanban & Sprint Tracker | React, Node.js, Express.js, MongoDB, Tailwind CSS
- Engineered real-time drag-and-drop issue boards with role-based permissions and audit trails.

CERTIFICATIONS
- MongoDB Certified Associate Developer
""",
    },
]


SEED_KNOWLEDGE_DOCS = [
    {
        "title": "Interview Process, Rounds & Hiring Timeline",
        "category": "INTERVIEW_PROCESS",
        "tags": ["interview", "rounds", "timeline", "hiring process", "stages"],
        "content": (
            "Our end-to-end hiring process typically completes within 10 to 14 business days across 4 structured stages:\n\n"
            "Round 1 — Automated NLP Screening & Profile Review (Days 1–2): Resumes are parsed by TalentLens AI for core technical skills, project depth, and role alignment. Shortlisted candidates receive an invite within 48 hours.\n\n"
            "Round 2 — Practical Technical Assessment (60 mins, Days 3–5): Role-tailored coding and problem-solving challenge covering DSA, API/SQL design, or ML/NLP modeling depending on the role.\n\n"
            "Round 3 — Technical Deep-Dive & System Design Interview (60 mins, Days 6–9): Live pairing session with senior engineers exploring architecture of past projects, debugging, database modeling, and trade-offs.\n\n"
            "Round 4 — Hiring Manager & Culture Alignment Chat (30 mins, Days 10–12): Discussion on career trajectory, collaboration style, role expectations, and compensation alignment followed by a formal offer within 48 hours."
        ),
    },
    {
        "title": "Technical Screening Rubric & Shortlisting Thresholds",
        "category": "TECHNICAL_RUBRIC",
        "tags": ["rubric", "shortlist", "scoring", "evaluation", "matching"],
        "content": (
            "TalentLens AI evaluates every candidate using a transparent 4-pillar weighted matching model:\n\n"
            "1. Required Technical Skills Match (45% weight): Exact and synonym-normalized verification of core role skills (e.g., Python, Django, Spring Boot, React, SQL, NLP).\n"
            "2. Preferred & Bonus Skills Match (20% weight): Cloud, DevOps, AI/ML tooling, and domain accelerators.\n"
            "3. Experience & Academic Readiness Fit (15% weight): Alignment with role minimum experience years and CGPA guidelines.\n"
            "4. Candidate Assessment & ATS Resume Quality (20% weight): Combines coding/technical assessment performance (60%) and structured ATS quality insights (40%).\n\n"
            "Shortlisting Tiers: STRONG_MATCH (>= 80% overall, <=1 required gap) is fast-tracked directly to technical interviews. GOOD_FIT (66%–79%) is shortlisted for recruiter review. POTENTIAL (50%–65%) is evaluated via technical assessment before advancing."
        ),
    },
    {
        "title": "Compensation, ESOPs & Employee Benefits Package",
        "category": "BENEFITS",
        "tags": ["salary", "benefits", "esops", "insurance", "perks", "learning"],
        "content": (
            "We offer transparent, market-competitive compensation benchmarked at the 80th percentile of Indian tech companies, plus comprehensive benefits:\n\n"
            "- Base Salary + Annual Performance Bonus (10%–15%) + Early-stage ESOP grant vesting over 4 years.\n"
            "- Comprehensive Family Health Insurance (₹10L coverage including parents, dental, and mental wellness support).\n"
            "- Annual Learning & Certification Budget of ₹50,000 per employee for courses, cloud certifications (AWS/GCP), books, and tech conferences.\n"
            "- Home-Office Setup Stipend of ₹35,000 on joining plus MacBook Pro / high-spec workstation provided.\n"
            "- 24 Paid Annual Leaves, 12 Sick/Wellness Leaves, plus flexible recharge Fridays every quarter."
        ),
    },
    {
        "title": "Campus Hiring & Freshers Eligibility Policy",
        "category": "POLICY",
        "tags": ["campus", "freshers", "cgpa", "eligibility", "intern", "ppo"],
        "content": (
            "Campus & Early-Career Hiring Guidelines for 2025/2026 graduating batches (B.E./B.Tech/M.Tech/MCA/B.Sc CS):\n\n"
            "- Minimum CGPA Cutoff: 7.0/10 for Full-Time Engineering roles (6.5/10 for Frontend roles and 7.5/10 for Applied ML Internships) with zero active backlogs at joining.\n"
            "- Exceptional open-source contributors, hackathon winners, or candidates with strong deployed GitHub projects may receive a CGPA relaxation upon Hiring Manager review.\n"
            "- Internship-to-PPO Conversion: Machine Learning and Software Engineering Interns undergo a midpoint mentorship review at Week 8 and a final capstone presentation at Week 14; historically 78% convert to full-time offers."
        ),
    },
    {
        "title": "Remote, Hybrid & Flexible Work Policy",
        "category": "POLICY",
        "tags": ["remote", "hybrid", "wfh", "location", "work mode", "relocation"],
        "content": (
            "We operate a trust-first flexible workplace model tailored by team collaboration needs:\n\n"
            "- Hybrid Roles (Bengaluru & Chennai hubs): 2 collaborative anchor days per week in-office (typically Tuesday and Thursday) and 3 remote days.\n"
            "- Remote-First Roles (Applied AI Research & Product Experience): Fully remote anywhere within India with quarterly all-expenses-paid team offsites.\n"
            "- Relocation Support: Candidates relocating to Bengaluru, Chennai, Hyderabad, or Pune receive ₹60,000 relocation assistance plus 14 days of company-sponsored temporary stay."
        ),
    },
    {
        "title": "Coding & Technical Assessment Guidelines",
        "category": "INTERVIEW_PROCESS",
        "tags": ["coding test", "assessment", "dsa", "sql", "preparation"],
        "content": (
            "What to expect in the 60-minute Online Technical Assessment:\n\n"
            "- Backend & Full-Stack Track: 2 medium Data Structures & Algorithms problems (arrays, trees, graphs, dynamic programming) + 1 practical REST API or SQL query optimization task. Allowed languages: Python, Java, JavaScript, TypeScript, C++.\n"
            "- AI/ML/NLP Track: 1 Python algorithmic problem + 1 applied NLP/ML scenario covering TF-IDF/BM25, classification metrics (Precision/Recall/F1), and RAG architecture debugging.\n"
            "- Data Analyst Track: 3 complex SQL window-function/aggregation problems + 1 Pandas data cleaning and KPI interpretation case.\n"
            "- Scoring above 75/100 qualifies candidates automatically for the Technical Deep-Dive interview."
        ),
    },
    {
        "title": "Applicant Resume Optimization & ATS Best Practices",
        "category": "JOB_FAQ",
        "tags": ["resume", "ats", "tips", "applicant", "projects", "github"],
        "content": (
            "How to achieve a 85+ ATS Quality Score on TalentLens AI:\n\n"
            "1. Use clean single-column PDF, DOCX, or text formatting with standard headings (Summary, Education, Technical Skills, Experience, Projects, Certifications).\n"
            "2. Explicitly list canonical technical skills across languages, frameworks, databases, and cloud tools so the NLP parser extracts your full stack accurately.\n"
            "3. Quantify impact in project bullets using concrete metrics (e.g., 'reduced API latency by 35%', 'achieved 94% extraction accuracy', 'served 500+ active users').\n"
            "4. Include clickable GitHub and LinkedIn URLs along with your degree, institution, and CGPA for early-career roles."
        ),
    },
    {
        "title": "Engineering Culture, Mentorship & Growth Tracks",
        "category": "CULTURE",
        "tags": ["culture", "mentorship", "growth", "career", "engineering"],
        "content": (
            "Engineering at TalentLens values high ownership, written clarity, and rapid experimentation:\n\n"
            "- Dedicated Buddy & Mentor: Every new engineer and intern is paired with a Staff/Senior mentor for weekly 1:1 technical feedback and code review coaching.\n"
            "- Dual Career Ladder: Transparent progression across Individual Contributor (SDE-1 -> SDE-2 -> Senior -> Staff) and Engineering Management tracks reviewed bi-annually.\n"
            "- Innovation Fridays: One Friday every month is dedicated to internal hackathons, open-source contributions, or AI/RAG prototype demos."
        ),
    },
    {
        "title": "Offer Acceptance, Background Verification & Onboarding",
        "category": "JOB_FAQ",
        "tags": ["onboarding", "offer", "joining", "background check", "notice period"],
        "content": (
            "Post-Offer & Onboarding Milestones:\n\n"
            "- Candidates have 7 calendar days to review and digitally sign the offer letter; our recruiting partner is always available for a compensation walkthrough.\n"
            "- Notice Period: We accommodate standard notice periods up to 60 days and provide partial notice-period buyout support on a case-by-case basis.\n"
            "- Pre-Joining & Week 1: Laptop ships 5 days prior to joining. Week 1 covers architecture deep-dives, local dev environment setup, security orientation, and shipping your first starter PR by Day 5."
        ),
    },
    {
        "title": "Re-Application, Feedback & Equal Opportunity Policy",
        "category": "POLICY",
        "tags": ["reapply", "feedback", "diversity", "equal opportunity", "cool-off"],
        "content": (
            "Candidate Fairness & Re-Application Guidelines:\n\n"
            "- Constructive Feedback: Every candidate who completes the Technical Deep-Dive round receives structured written feedback highlighting strengths and growth areas within 5 business days.\n"
            "- Cool-Off Period: Candidates who are not selected may re-apply for the same track after 6 months, or immediately for a materially different engineering specialization.\n"
            "- Equal Opportunity: TalentLens evaluates applicants solely on skills, project merit, problem-solving ability, and role alignment through structured rubrics."
        ),
    },
]


class Command(BaseCommand):
    help = "Idempotently seed JobRoles, NLP-parsed Candidates, MatchEvaluations, and RAG KnowledgeDocuments."

    def handle(self, *args, **options):
        jobs_created = 0
        for job_data in SEED_JOBS:
            _, created = JobRole.objects.update_or_create(
                title=job_data["title"],
                defaults=job_data,
            )
            if created:
                jobs_created += 1

        cands_created = 0
        for cand_spec in SEED_CANDIDATES:
            parsed = parse_resume_text(
                cand_spec["resume_text"], filename=cand_spec["filename"]
            )
            parsed["pipeline_stage"] = cand_spec["stage"]
            parsed["assessment_score"] = cand_spec["assessment_score"]
            parsed["email"] = cand_spec["email"]

            cand, created = Candidate.objects.update_or_create(
                email=cand_spec["email"],
                defaults=parsed,
            )
            if created:
                cands_created += 1
            evaluate_candidate_against_all_roles(cand)

        docs_created = 0
        for doc_data in SEED_KNOWLEDGE_DOCS:
            chunk_cnt = max(1, len(chunk_document_text(doc_data["content"])))
            _, created = KnowledgeDocument.objects.update_or_create(
                title=doc_data["title"],
                defaults={
                    "category": doc_data["category"],
                    "content": doc_data["content"],
                    "tags": doc_data["tags"],
                    "chunk_count": chunk_cnt,
                },
            )
            if created:
                docs_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete! Jobs: {JobRole.objects.count()} (+{jobs_created}), "
                f"Candidates: {Candidate.objects.count()} (+{cands_created}), "
                f"Knowledge Docs: {KnowledgeDocument.objects.count()} (+{docs_created})."
            )
        )
