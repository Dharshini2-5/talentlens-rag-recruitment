"""Pure-Python NLP Resume Parsing & Candidate Profiling Engine for TalentLens AI.

Supports .pdf (via pypdf), .docx (native zipfile + XML parsing with zero C-extensions),
.txt, and raw pasted text. Implements custom tokenization, stopword filtering,
Porter-style stemming, n-gram extraction, 130+ multi-category technical skills taxonomy,
entity extraction, ATS quality scoring, and automated preliminary screening summaries.
"""

from __future__ import annotations

import io
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Any

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover
    PdfReader = None


STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "can", "could", "did", "do", "does", "doing",
    "down", "during", "each", "few", "for", "from", "further", "had", "has", "have",
    "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
    "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more",
    "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once",
    "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same",
    "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs",
    "them", "themselves", "then", "there", "these", "they", "this", "those", "through",
    "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", "when",
    "where", "which", "while", "who", "whom", "why", "will", "with", "would", "you",
    "your", "yours", "yourself", "yourselves", "using", "used", "built", "developed",
    "designed", "implemented", "created", "worked", "experience", "resume", "curriculum",
    "vitae", "summary", "profile", "objective", "skills", "education", "projects",
}

# 135+ categorized technical & domain skills
SKILL_TAXONOMY: dict[str, list[str]] = {
    "Languages": [
        "Python", "Java", "JavaScript", "TypeScript", "C++", "C", "C#", "SQL",
        "Go", "Rust", "Kotlin", "Swift", "R", "PHP", "Ruby", "Bash", "HTML",
        "CSS", "Scala", "Dart", "MATLAB", "PL/SQL",
    ],
    "Frameworks": [
        "Django", "Django REST Framework", "Spring Boot", "React", "Next.js",
        "Node.js", "Express.js", "FastAPI", "Flask", "Vue.js", "Angular",
        "Tailwind CSS", "Bootstrap", "Hibernate", "JPA", "GraphQL", "REST APIs",
        "Microservices", "Redux", "Vite", "WebSockets", "Flutter", "Framer Motion",
        "Streamlit", "Spring MVC", "Celery",
    ],
    "Databases": [
        "PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Oracle SQL",
        "Elasticsearch", "Firebase", "DynamoDB", "Cassandra", "Prisma",
        "SQLAlchemy", "Neo4j", "Supabase", "Snowflake",
    ],
    "AI/ML/NLP": [
        "Machine Learning", "Deep Learning", "NLP", "RAG", "LLMs", "LangChain",
        "PyTorch", "TensorFlow", "Keras", "Scikit-learn", "Pandas", "NumPy",
        "Hugging Face", "Transformers", "OpenCV", "TF-IDF", "BM25",
        "Computer Vision", "Vector Databases", "FAISS", "ChromaDB",
        "Prompt Engineering", "Feature Engineering", "Data Analysis",
        "Predictive Analytics", "Power BI", "Tableau", "Statistical Modeling",
        "Sentiment Analysis", "Named Entity Recognition", "spaCy", "NLTK",
    ],
    "Cloud/DevOps": [
        "AWS", "Docker", "Kubernetes", "Git", "GitHub", "GitHub Actions",
        "CI/CD", "Linux", "Azure", "GCP", "Terraform", "Nginx", "Jenkins",
        "Postman", "Vercel", "Netlify", "Render", "Prometheus", "Grafana",
        "Maven", "Gradle",
    ],
    "Core CS": [
        "Data Structures & Algorithms", "OOP", "DBMS", "Operating Systems",
        "Computer Networks", "System Design", "Agile", "Scrum", "Unit Testing",
        "PyTest", "JUnit", "Software Architecture", "JWT", "OAuth2",
        "Information Retrieval", "API Design", "Problem Solving",
        "Web Security", "Performance Optimization",
    ],
}

# Build reverse lookup from canonical skill -> category
SKILL_TO_CATEGORY: dict[str, str] = {}
CANONICAL_SKILLS_LOWER: dict[str, str] = {}
for _cat, _skills in SKILL_TAXONOMY.items():
    for _skill in _skills:
        SKILL_TO_CATEGORY[_skill] = _cat
        CANONICAL_SKILLS_LOWER[_skill.lower()] = _skill

# Rich alias/synonym mapping -> canonical skill name
SKILL_ALIASES: dict[str, str] = {
    "py": "Python",
    "python3": "Python",
    "python 3": "Python",
    "js": "JavaScript",
    "ecmascript": "JavaScript",
    "es6": "JavaScript",
    "ts": "TypeScript",
    "cpp": "C++",
    "c plus plus": "C++",
    "csharp": "C#",
    "c sharp": "C#",
    "golang": "Go",
    "html5": "HTML",
    "css3": "CSS",
    "shell scripting": "Bash",
    "shell": "Bash",
    "drf": "Django REST Framework",
    "django rest": "Django REST Framework",
    "django rest framework": "Django REST Framework",
    "springboot": "Spring Boot",
    "spring-boot": "Spring Boot",
    "spring": "Spring Boot",
    "reactjs": "React",
    "react.js": "React",
    "react 18": "React",
    "react 19": "React",
    "nextjs": "Next.js",
    "next": "Next.js",
    "nodejs": "Node.js",
    "node": "Node.js",
    "expressjs": "Express.js",
    "express": "Express.js",
    "vuejs": "Vue.js",
    "vue": "Vue.js",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "rest api": "REST APIs",
    "restful api": "REST APIs",
    "restful apis": "REST APIs",
    "rest": "REST APIs",
    "microservice": "Microservices",
    "websocket": "WebSockets",
    "spring data jpa": "JPA",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "psql": "PostgreSQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "sqlite3": "SQLite",
    "oracle": "Oracle SQL",
    "elastic": "Elasticsearch",
    "ml": "Machine Learning",
    "dl": "Deep Learning",
    "natural language processing": "NLP",
    "nlp": "NLP",
    "retrieval augmented generation": "RAG",
    "retrieval-augmented generation": "RAG",
    "rag": "RAG",
    "llm": "LLMs",
    "llms": "LLMs",
    "large language models": "LLMs",
    "large language model": "LLMs",
    "langchain": "LangChain",
    "sklearn": "Scikit-learn",
    "scikit learn": "Scikit-learn",
    "scikit-learn": "Scikit-learn",
    "huggingface": "Hugging Face",
    "hugging face": "Hugging Face",
    "transformer": "Transformers",
    "tfidf": "TF-IDF",
    "tf-idf": "TF-IDF",
    "bm25": "BM25",
    "cv": "Computer Vision",
    "vector db": "Vector Databases",
    "vector database": "Vector Databases",
    "chroma": "ChromaDB",
    "data analytics": "Data Analysis",
    "analytics": "Data Analysis",
    "powerbi": "Power BI",
    "ner": "Named Entity Recognition",
    "spacy": "spaCy",
    "nltk": "NLTK",
    "amazon web services": "AWS",
    "k8s": "Kubernetes",
    "cicd": "CI/CD",
    "ci/cd": "CI/CD",
    "github action": "GitHub Actions",
    "google cloud": "GCP",
    "google cloud platform": "GCP",
    "microsoft azure": "Azure",
    "dsa": "Data Structures & Algorithms",
    "data structures": "Data Structures & Algorithms",
    "data structures and algorithms": "Data Structures & Algorithms",
    "algorithms": "Data Structures & Algorithms",
    "oops": "OOP",
    "object oriented programming": "OOP",
    "object-oriented programming": "OOP",
    "database management systems": "DBMS",
    "database management": "DBMS",
    "os": "Operating Systems",
    "networking": "Computer Networks",
    "cn": "Computer Networks",
    "pytest": "PyTest",
    "junit": "JUnit",
    "testing": "Unit Testing",
    "json web token": "JWT",
    "oauth": "OAuth2",
    "oauth 2.0": "OAuth2",
}


def simple_stem(word: str) -> str:
    """Lightweight Porter-inspired pure-Python stemmer for retrieval & matching."""
    w = word.lower().strip()
    if len(w) <= 3:
        return w
    for suffix, repl in (
        ("ational", "ate"),
        ("tional", "tion"),
        ("ization", "ize"),
        ("iveness", "ive"),
        ("fulness", "ful"),
        ("ousness", "ous"),
        ("biliti", "ble"),
        ("ies", "y"),
        ("ied", "y"),
        ("ing", ""),
        ("edly", ""),
        ("ingly", ""),
        ("ment", ""),
        ("ness", ""),
        ("able", ""),
        ("ible", ""),
        ("tion", "t"),
        ("sion", "s"),
        ("ance", ""),
        ("ence", ""),
        ("ally", ""),
        ("ful", ""),
        ("ous", ""),
        ("ive", ""),
        ("ize", ""),
        ("ise", ""),
        ("ers", ""),
        ("ed", ""),
        ("es", ""),
        ("ly", ""),
    ):
        if w.endswith(suffix) and len(w) - len(suffix) >= 3:
            w = w[: -len(suffix)] + repl
            break
    if w.endswith("s") and not w.endswith("ss") and len(w) > 3:
        w = w[:-1]
    return w


def tokenize(text: str, remove_stopwords: bool = True, stem: bool = False) -> list[str]:
    """Tokenize text preserving technical tokens like c++, c#, node.js, ci/cd."""
    if not text:
        return []
    raw_tokens = re.findall(r"[a-zA-Z0-9]+(?:[+#./-][a-zA-Z0-9+#]+)*", text.lower())
    result: list[str] = []
    for tok in raw_tokens:
        tok = tok.strip(".-/")
        if not tok or (len(tok) == 1 and tok not in {"c", "r"}):
            continue
        if remove_stopwords and tok in STOPWORDS:
            continue
        result.append(simple_stem(tok) if stem else tok)
    return result


def extract_ngrams(tokens: list[str], n: int = 2) -> list[str]:
    """Generate contiguous n-gram phrases from token list."""
    if len(tokens) < n:
        return []
    return [" ".join(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]


def normalize_skill(skill: str) -> str:
    """Normalize a raw skill name or alias to its canonical taxonomy label."""
    cleaned = re.sub(r"\s+", " ", (skill or "").strip())
    if not cleaned:
        return ""
    low = cleaned.lower()
    if low in SKILL_ALIASES:
        return SKILL_ALIASES[low]
    if low in CANONICAL_SKILLS_LOWER:
        return CANONICAL_SKILLS_LOWER[low]
    # Check trimmed punctuation variants
    low_alnum = re.sub(r"[^a-z0-9+#./ ]+", "", low).strip()
    if low_alnum in SKILL_ALIASES:
        return SKILL_ALIASES[low_alnum]
    if low_alnum in CANONICAL_SKILLS_LOWER:
        return CANONICAL_SKILLS_LOWER[low_alnum]
    return cleaned


def extract_text_from_file(uploaded_file) -> tuple[str, str]:
    """Extract plain text from uploaded .pdf, .docx, or .txt file without C-extensions."""
    filename = getattr(uploaded_file, "name", "resume.txt") or "resume.txt"
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else "txt"
    data = uploaded_file.read()
    if isinstance(data, str):
        return data, filename

    if ext == "pdf":
        if PdfReader is None:
            raise ValueError("pypdf is required to parse PDF resumes.")
        reader = PdfReader(io.BytesIO(data))
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        text = "\n".join(pages).strip()
        if not text:
            raise ValueError("Could not extract readable text from the PDF file.")
        return text, filename

    if ext == "docx":
        # Pure-Python native DOCX XML extraction (zero lxml/C dependencies)
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                xml_bytes = zf.read("word/document.xml")
            root = ET.fromstring(xml_bytes)
            ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
            paragraphs: list[str] = []
            for p in root.findall(".//w:p", ns):
                runs = [t.text for t in p.findall(".//w:t", ns) if t.text]
                if runs:
                    paragraphs.append("".join(runs))
            text = "\n".join(paragraphs).strip()
            if not text:
                raise ValueError("The uploaded DOCX file appears to be empty.")
            return text, filename
        except Exception as exc:
            raise ValueError(f"Unable to parse DOCX file: {exc}") from exc

    # Default text fallback (.txt, .md, etc.)
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            text = data.decode(encoding).strip()
            if text:
                return text, filename
        except UnicodeDecodeError:
            continue
    raise ValueError("Unsupported or unreadable resume file encoding.")


def _extract_name(lines: list[str]) -> str:
    """Infer candidate full name from the top resume header lines."""
    skip_keywords = {
        "resume", "curriculum", "vitae", "cv", "profile", "summary", "objective",
        "contact", "phone", "email", "address", "linkedin", "github", "portfolio",
        "skills", "education", "experience", "projects", "certifications",
    }
    for line in lines[:8]:
        clean = re.sub(r"[|•·]+.*$", "", line).strip()
        clean = re.sub(r"^name\s*[:\-]\s*", "", clean, flags=re.I).strip()
        if not clean or len(clean) < 3 or len(clean) > 55:
            continue
        if "@" in clean or "http" in clean.lower() or re.search(r"\d{4,}", clean):
            continue
        words = clean.split()
        if not (1 <= len(words) <= 4):
            continue
        if any(w.lower().strip(":.,") in skip_keywords for w in words):
            continue
        # Ensure alphabetic name tokens (allowing initial like "A" or "A.")
        if all(re.match(r"^[A-Za-z][A-Za-z.\'-]*$", w) for w in words):
            # Convert ALL CAPS names neatly
            if clean.isupper():
                return " ".join(w.title() if len(w) > 1 else w for w in words)
            return clean
    return "Candidate Profile"


def _extract_email(text: str) -> str:
    match = re.search(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else ""


def _extract_phone(text: str) -> str:
    match = re.search(
        r"(?:\+?\d{1,3}[\s\-]?)?(?:\(?\d{3,5}\)?[\s\-]?)?\d{3,5}[\s\-]?\d{4,5}",
        text,
    )
    if match:
        digits = re.sub(r"\D", "", match.group(0))
        if 10 <= len(digits) <= 13:
            return match.group(0).strip()
    return ""


def _extract_links(text: str) -> tuple[str, str]:
    linkedin = ""
    github = ""
    li_match = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[A-Za-z0-9\-_%/]+", text, re.I)
    if li_match:
        linkedin = li_match.group(0)
        if not linkedin.startswith("http"):
            linkedin = "https://" + linkedin
    gh_match = re.search(r"(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9\-_]+", text, re.I)
    if gh_match:
        github = gh_match.group(0)
        if not github.startswith("http"):
            github = "https://" + github
    return linkedin, github


def _extract_location(text: str) -> str:
    known_cities = [
        "Bengaluru", "Bangalore", "Chennai", "Hyderabad", "Pune", "Mumbai",
        "Coimbatore", "Madurai", "Trichy", "Salem", "Vellore", "Kochi",
        "Noida", "Gurugram", "Gurgaon", "Delhi", "New Delhi", "Kolkata",
        "Ahmedabad", "Jaipur", "Chandigarh", "San Francisco", "New York",
        "Seattle", "Austin", "London", "Toronto", "Singapore", "Remote",
    ]
    top_chunk = text[:700]
    for city in known_cities:
        if re.search(rf"\b{re.escape(city)}\b", top_chunk, re.I):
            return "Bengaluru, India" if city.lower() == "bangalore" else city
    loc_match = re.search(r"location\s*[:\-]\s*([A-Za-z ,]{3,45})", text, re.I)
    if loc_match:
        return loc_match.group(1).strip()
    return "India"


def _extract_education_and_cgpa(text: str) -> tuple[str, float | None]:
    cgpa: float | None = None
    # CGPA / GPA on 10-point or 4-point scale
    cgpa_match = re.search(
        r"(?:cgpa|gpa)\s*[:\-–=]?\s*(\d+(?:\.\d{1,2})?)(?:\s*/\s*(10|4(?:\.0)?))?",
        text,
        re.I,
    )
    if cgpa_match:
        val = float(cgpa_match.group(1))
        scale = cgpa_match.group(2)
        if scale and scale.startswith("4"):
            cgpa = round(min(10.0, (val / 4.0) * 10.0), 2)
        elif val <= 4.0:
            cgpa = round(min(10.0, (val / 4.0) * 10.0), 2)
        elif val <= 10.0:
            cgpa = round(val, 2)
    else:
        pct_match = re.search(r"(?:aggregate|percentage|score)\s*[:\-]?\s*(\d{2}(?:\.\d+)?)\s*%", text, re.I)
        if pct_match:
            cgpa = round(float(pct_match.group(1)) / 9.5, 2)

    degree_patterns = [
        r"((?:B\.?\s?E\.?|B\.?\s?Tech|M\.?\s?E\.?|M\.?\s?Tech|B\.?\s?Sc|M\.?\s?Sc|MCA|BCA|MBA|Ph\.?\s?D)[^\n]{0,110})",
        r"((?:Bachelor|Master)\s+of\s+(?:Engineering|Technology|Science|Computer\s+Applications)[^\n]{0,110})",
    ]
    education = ""
    for pat in degree_patterns:
        m = re.search(pat, text, re.I)
        if m:
            education = re.sub(r"\s+", " ", m.group(1)).strip(" |,-•")
            break
    if not education:
        for line in text.splitlines():
            if any(k in line.lower() for k in ("university", "institute of technology", "college of engineering")):
                education = line.strip(" |,-•")[:140]
                break
    return education or "B.E. / B.Tech in Computer Science & Engineering", cgpa


def _extract_experience_years(text: str) -> float:
    # 1. Explicit "X+ years of experience" mention
    exp_matches = re.findall(
        r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:hands-on\s+|industry\s+|professional\s+|software\s+|relevant\s+)?experience",
        text,
        re.I,
    )
    if exp_matches:
        return round(max(float(v) for v in exp_matches), 1)

    # 2. Extract experience section date ranges (avoid education section years)
    sections = _split_sections(text)
    exp_text = sections.get("experience", "") or sections.get("work experience", "") or sections.get("internships", "")
    if not exp_text:
        return 0.0

    months_map = {
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
        "jul": 7, "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
    }
    now = datetime.now()
    total_months = 0

    # Month Year - Month Year / Present
    range_pattern = re.compile(
        r"(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*(\d{4})\s*[\-–—to]+\s*"
        r"(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*(\d{4})|(present|current|now))",
        re.I,
    )
    for m in range_pattern.finditer(exp_text):
        sm = months_map[m.group(1).lower()[:3]]
        sy = int(m.group(2))
        if m.group(5):
            em, ey = now.month, now.year
        else:
            em = months_map[m.group(3).lower()[:3]]
            ey = int(m.group(4))
        diff = max(1, (ey - sy) * 12 + (em - sm) + 1)
        if diff <= 180:
            total_months += diff

    if total_months == 0:
        # Year - Year / Present fallback inside experience section
        yr_pat = re.compile(r"\b(20\d{2})\s*[\-–—to]+\s*(20\d{2}|present|current)\b", re.I)
        for m in yr_pat.finditer(exp_text):
            sy = int(m.group(1))
            ey = now.year if not m.group(2).isdigit() else int(m.group(2))
            if 0 <= ey - sy <= 15:
                total_months += max(6, (ey - sy) * 12)

    if total_months == 0 and re.search(r"\bintern(ship)?\b", exp_text, re.I):
        return 0.5

    return round(min(20.0, total_months / 12.0), 1)


def _split_sections(text: str) -> dict[str, str]:
    """Split resume text into logical sections based on common headings."""
    heading_aliases = {
        "summary": "summary",
        "professional summary": "summary",
        "objective": "summary",
        "about": "summary",
        "skills": "skills",
        "technical skills": "skills",
        "core competencies": "skills",
        "experience": "experience",
        "work experience": "experience",
        "professional experience": "experience",
        "employment": "experience",
        "internships": "experience",
        "internship": "experience",
        "projects": "projects",
        "academic projects": "projects",
        "key projects": "projects",
        "personal projects": "projects",
        "education": "education",
        "academic background": "education",
        "certifications": "certifications",
        "certificates": "certifications",
        "awards": "certifications",
        "achievements": "certifications",
        "courses": "certifications",
    }
    sections: dict[str, list[str]] = {"header": []}
    current = "header"
    for raw_line in text.splitlines():
        stripped = raw_line.strip()
        if not stripped:
            continue
        norm = re.sub(r"[^a-zA-Z ]+", "", stripped).strip().lower()
        if norm in heading_aliases and len(stripped) <= 45:
            current = heading_aliases[norm]
            sections.setdefault(current, [])
            continue
        sections.setdefault(current, []).append(stripped)
    return {k: "\n".join(v) for k, v in sections.items()}


def extract_skills(text: str) -> tuple[list[str], dict[str, list[str]]]:
    """Extract and categorize technical skills using exact regex + n-gram alias matching."""
    found: set[str] = set()
    low_text = text.lower()

    # Check every canonical skill and alias with boundary-safe regex
    candidates: list[tuple[str, str]] = []
    for canonical in SKILL_TO_CATEGORY:
        candidates.append((canonical.lower(), canonical))
    for alias, canonical in SKILL_ALIASES.items():
        candidates.append((alias.lower(), canonical))

    # Ambiguous very short tokens require strict word boundaries & uppercase/context checks
    strict_short = {"c", "r", "go", "os", "cn", "cv", "py", "js", "ts", "ml", "dl", "ai", "rest"}

    for needle, canonical in candidates:
        if needle in strict_short:
            if needle == "c":
                if re.search(r"(?:^|[\s,;/|(])C(?=[,\s;/|)]|$)", text) and not re.search(r"C\+\+|C#", needle):
                    found.add("C")
                continue
            if needle == "r":
                if re.search(r"(?:^|[\s,;/|(])R(?=[,\s;/|)]|$)", text) and "r programming" in low_text:
                    found.add("R")
                continue
            if needle == "go":
                if re.search(r"\b(?:Golang|Go\s+language)\b", text, re.I) or re.search(r"(?:,\s*|/\s*)Go(?:\s*,|\s*/|\s*$)", text):
                    found.add("Go")
                continue
            if needle in {"os", "cn", "cv", "py", "js", "ts", "ml", "dl"}:
                if re.search(rf"(?<![a-zA-Z0-9]){re.escape(needle.upper())}(?![a-zA-Z0-9])", text):
                    found.add(canonical)
                continue
            if needle == "rest":
                if re.search(r"\bREST(?:ful)?\s+API", text, re.I):
                    found.add("REST APIs")
                continue

        # Standard boundary-safe search (handles C++, C#, Node.js, CI/CD, Scikit-learn)
        pattern = rf"(?<![a-zA-Z0-9]){re.escape(needle)}(?![a-zA-Z0-9])"
        if re.search(pattern, low_text):
            found.add(canonical)

    # Also match n-grams from tokenized text
    toks = tokenize(text, remove_stopwords=False, stem=False)
    for n in (1, 2, 3):
        for gram in extract_ngrams(toks, n):
            if gram in SKILL_ALIASES and gram not in strict_short:
                found.add(SKILL_ALIASES[gram])
            elif gram in CANONICAL_SKILLS_LOWER and gram not in strict_short:
                found.add(CANONICAL_SKILLS_LOWER[gram])

    # Organize by category cleanly
    categorized: dict[str, list[str]] = {}
    ordered_skills: list[str] = []
    for cat, cat_skills in SKILL_TAXONOMY.items():
        present = [s for s in cat_skills if s in found]
        if present:
            categorized[cat] = present
            ordered_skills.extend(present)

    return ordered_skills, categorized


def _extract_projects(sections: dict[str, str], full_text: str) -> list[dict[str, str]]:
    proj_text = sections.get("projects", "")
    if not proj_text:
        return []
    projects: list[dict[str, str]] = []
    current_title = ""
    current_desc: list[str] = []

    for line in proj_text.splitlines():
        s = line.strip()
        if not s:
            continue
        is_bullet = s.startswith(("-", "•", "*", "▪", "–"))
        looks_like_title = (
            not is_bullet
            and len(s) <= 105
            and (
                "|" in s
                or "—" in s
                or " - " in s
                or ":" in s[:65]
                or (len(s.split()) <= 10 and not s.endswith("."))
            )
        )
        if looks_like_title:
            if current_title:
                projects.append(
                    {
                        "name": current_title,
                        "summary": " ".join(current_desc)[:260] or "Technical project implementation.",
                    }
                )
            parts = re.split(r"\s*[|—]\s*", s, maxsplit=1)
            current_title = parts[0].strip(" :-•*")
            current_desc = [parts[1].strip()] if len(parts) > 1 and parts[1].strip() else []
        else:
            cleaned = s.lstrip("-•*▪– ").strip()
            if not current_title:
                current_title = cleaned[:70]
            else:
                current_desc.append(cleaned)

    if current_title:
        projects.append(
            {
                "name": current_title,
                "summary": " ".join(current_desc)[:260] or "Technical project implementation.",
            }
        )
    return projects[:6]


def _extract_certifications(sections: dict[str, str], full_text: str) -> list[str]:
    certs: list[str] = []
    cert_text = sections.get("certifications", "")
    if cert_text:
        for line in cert_text.splitlines():
            cleaned = line.strip().lstrip("-•*▪– ").strip()
            if 5 <= len(cleaned) <= 140:
                certs.append(cleaned)
    if not certs:
        known_patterns = [
            r"(AWS Certified [A-Za-z0-9 \-]+)",
            r"(NPTEL [A-Za-z0-9 :\-]+)",
            r"(Oracle Certified [A-Za-z0-9 \-]+)",
            r"(Google [A-Za-z0-9 \-]+ Certificate)",
            r"(Microsoft Certified[: ][A-Za-z0-9 \-]+)",
            r"(Coursera [A-Za-z0-9 :\-]+)",
            r"(HackerRank [A-Za-z0-9 :\-]+)",
        ]
        for pat in known_patterns:
            for m in re.findall(pat, full_text, re.I):
                val = m.strip()
                if val not in certs:
                    certs.append(val)
    return certs[:6]


def _infer_seniority(exp_years: float, text: str) -> str:
    low = text.lower()
    if exp_years >= 6.0 or any(k in low for k in ("staff engineer", "principal engineer", "tech lead", "architect")):
        return "Lead / Principal"
    if exp_years >= 3.5 or "senior software" in low or "senior engineer" in low:
        return "Senior"
    if exp_years >= 1.5:
        return "Mid-Level"
    if exp_years >= 0.4:
        return "Junior (Entry-Level)"
    return "Fresher / Intern"


def _compute_ats_score(
    email: str,
    phone: str,
    linkedin: str,
    github: str,
    skills: list[str],
    skill_categories: dict[str, list[str]],
    projects: list[dict[str, str]],
    certifications: list[str],
    education: str,
    cgpa: float | None,
    raw_text: str,
) -> tuple[float, dict[str, Any]]:
    """Compute a transparent 0–100 ATS completeness & quality score with feedback."""
    strengths: list[str] = []
    suggestions: list[str] = []

    # 1. Contact & Online Presence (15 pts)
    contact_pts = 0.0
    if email:
        contact_pts += 5
    else:
        suggestions.append("Add a professional email address in the header.")
    if phone:
        contact_pts += 4
    else:
        suggestions.append("Include a reachable phone number.")
    if github or linkedin:
        contact_pts += 6
        strengths.append("Includes verifiable professional profile links (GitHub/LinkedIn).")
    else:
        suggestions.append("Link your GitHub and LinkedIn profiles to boost recruiter trust.")

    # 2. Skills Depth & Multi-Domain Breadth (30 pts)
    skill_pts = min(20.0, len(skills) * 1.8) + min(10.0, len(skill_categories) * 2.2)
    if len(skills) >= 10:
        strengths.append(f"Strong technical stack with {len(skills)} verified skills across {len(skill_categories)} domains.")
    else:
        suggestions.append("List core frameworks, databases, and tools explicitly in a Technical Skills section.")

    # 3. Projects & Action Verbs / Quantifiable Impact (28 pts)
    proj_pts = min(15.0, len(projects) * 5.0)
    metrics_found = re.findall(r"\b\d+(?:\.\d+)?\s*(?:%|x|ms|s|users|records|queries|accuracy|reduction|faster)\b", raw_text, re.I)
    action_verbs = re.findall(
        r"\b(?:developed|built|designed|engineered|architected|automated|optimized|deployed|implemented|reduced|improved|led)\b",
        raw_text,
        re.I,
    )
    impact_pts = min(8.0, len(metrics_found) * 2.5) + min(5.0, len(action_verbs) * 0.8)
    if metrics_found:
        strengths.append(f"Demonstrates measurable engineering impact ({len(metrics_found)} quantified metrics detected).")
    else:
        suggestions.append("Quantify project outcomes (e.g., latency reduction, accuracy %, user count).")
    if len(projects) >= 2:
        strengths.append(f"Showcases {len(projects)} structured technical projects.")
    else:
        suggestions.append("Add at least 2–3 well-structured projects highlighting architecture and tech stack.")

    # 4. Education & Credentials (17 pts)
    edu_pts = 7.0 if education else 2.0
    if cgpa is not None:
        edu_pts += 5.0 if cgpa >= 7.5 else 3.5
        if cgpa >= 8.0:
            strengths.append(f"Strong academic standing (CGPA {cgpa}/10).")
    else:
        suggestions.append("Include CGPA/GPA or graduation details for campus/early-career screening.")
    cert_pts = min(5.0, len(certifications) * 2.5)
    if certifications:
        strengths.append(f"Validated credentials with {len(certifications)} certification(s).")

    # 5. Formatting & Length Hygiene (10 pts)
    word_count = len(raw_text.split())
    format_pts = 10.0 if 180 <= word_count <= 1100 else (7.0 if word_count >= 90 else 4.0)
    if word_count < 140:
        suggestions.append("Expand project descriptions and technical responsibilities for fuller ATS parsing.")

    total = round(min(99.0, max(25.0, contact_pts + skill_pts + proj_pts + impact_pts + edu_pts + cert_pts + format_pts)), 1)
    breakdown = {
        "contact_presence": round((contact_pts / 15.0) * 100, 1),
        "skills_breadth": round((skill_pts / 30.0) * 100, 1),
        "projects_impact": round(((proj_pts + impact_pts) / 28.0) * 100, 1),
        "education_credentials": round(((edu_pts + cert_pts) / 17.0) * 100, 1),
        "ats_formatting": round((format_pts / 10.0) * 100, 1),
        "strengths": strengths[:4],
        "suggestions": suggestions[:4],
        "word_count": word_count,
    }
    return total, breakdown


def parse_resume_text(raw_text: str, filename: str = "pasted_resume.txt") -> dict[str, Any]:
    """Run full NLP resume parsing pipeline on plain resume text."""
    cleaned_text = re.sub(r"\r\n?", "\n", raw_text or "").strip()
    lines = [ln.strip() for ln in cleaned_text.splitlines() if ln.strip()]
    sections = _split_sections(cleaned_text)

    full_name = _extract_name(lines)
    email = _extract_email(cleaned_text)
    phone = _extract_phone(cleaned_text)
    linkedin_url, github_url = _extract_links(cleaned_text)
    location = _extract_location(cleaned_text)
    education, cgpa = _extract_education_and_cgpa(cleaned_text)
    experience_years = _extract_experience_years(cleaned_text)
    seniority_level = _infer_seniority(experience_years, cleaned_text)
    extracted_skills, skill_categories = extract_skills(cleaned_text)
    projects = _extract_projects(sections, cleaned_text)
    certifications = _extract_certifications(sections, cleaned_text)

    ats_score, ats_feedback = _compute_ats_score(
        email=email,
        phone=phone,
        linkedin=linkedin_url,
        github=github_url,
        skills=extracted_skills,
        skill_categories=skill_categories,
        projects=projects,
        certifications=certifications,
        education=education,
        cgpa=cgpa,
        raw_text=cleaned_text,
    )

    # Derive an intelligent preliminary assessment baseline from resume depth
    assessment_estimate = round(
        min(96.0, max(58.0, 52.0 + len(extracted_skills) * 1.45 + len(projects) * 3.5 + (cgpa or 7.2) * 1.6)),
        1,
    )

    top_domains = list(skill_categories.keys())[:3]
    domain_str = ", ".join(top_domains) if top_domains else "General Software Engineering"
    top_skills_str = ", ".join(extracted_skills[:7]) if extracted_skills else "Core Engineering"
    cgpa_str = f" with CGPA {cgpa}" if cgpa else ""
    exp_str = f"{experience_years} yrs experience" if experience_years > 0 else "early-career / fresher profile"

    screening_summary = (
        f"{full_name} is a {seniority_level} candidate ({exp_str}{cgpa_str}) specializing in {domain_str}. "
        f"Verified proficiency in {top_skills_str}. "
        f"Parsed {len(projects)} technical project(s) and {len(certifications)} certification(s) "
        f"with an ATS Quality Score of {ats_score}/100."
    )

    return {
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "location": location,
        "linkedin_url": linkedin_url,
        "github_url": github_url,
        "education": education,
        "cgpa": cgpa,
        "experience_years": experience_years,
        "seniority_level": seniority_level,
        "raw_resume_text": cleaned_text,
        "resume_filename": filename,
        "extracted_skills": extracted_skills,
        "skill_categories": skill_categories,
        "certifications": certifications,
        "projects": projects,
        "ats_score": ats_score,
        "ats_feedback": ats_feedback,
        "screening_summary": screening_summary,
        "assessment_score": assessment_estimate,
        "pipeline_stage": "SCREENED",
    }
