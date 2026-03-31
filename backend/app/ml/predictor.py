"""
TruthLens - Hybrid ML Predictor (Phase 2)
==========================================
Two-stage credibility analysis pipeline:

  STAGE 1 — Local heuristic (always runs, zero latency, no API key needed)
    • TF-IDF-style signal matching (extends IJCRT Vol 12 Issue 4 research)
    • Detects misinformation patterns: sensationalism, vague sourcing, conspiracy language
    • Detects credibility markers: attribution, precision language, institutional references
    • Sets ai_enhanced=False

  STAGE 2 — OpenAI enrichment (runs only if OPENAI_API_KEY is set)
    • Sends content + Stage 1 scores to GPT-4o-mini for expert reasoning
    • On ANY failure → Stage 1 result used as-is (never crashes)
    • Sets ai_enhanced=True on success

Response schema (identical regardless of which stage ran):
    verdict          : "FAKE" | "MISLEADING" | "UNCERTAIN" | "REAL"
    confidence       : float 0–100
    credibility_score: float 0–100
    explanation      : str
    keywords         : List[str]
    sentiment        : "positive" | "negative" | "neutral"
    sentiment_score  : float -1.0–1.0
    bias_indicators  : List[str]
    ai_enhanced      : bool
"""

import re
import json
import logging
from typing import List, Tuple, Optional

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Signal Pattern Libraries
# ─────────────────────────────────────────────────────────────────────────────

FAKE_SIGNALS: List[str] = [
    r"\bshocking\b", r"\bexplosive\b", r"\bblockbuster\b",
    r"\byou won.?t believe\b", r"\bmust.?see\b",
    r"\bthey don.?t want you to know\b", r"\bthe truth about\b",
    r"\bwake up\b", r"\bdeep state\b", r"\bcover.?up\b",
    r"\bmainstream media\b", r"\belites?\b",
    r"\bexperts say\b", r"\bstudies show\b", r"\bsources say\b",
    r"\bsome people say\b", r"\bpeople are saying\b", r"\beveryone knows\b",
    r"\b100%\s*(proven|confirmed|true|guaranteed)\b",
    r"\bscientists (confirm|prove|reveal)\b",
    r"\bgovernment (hides|hiding|admits)\b",
    r"\bact now\b", r"\bshare (this|now|before)\b",
    r"\bspread the word\b",
    r"\bbefore (they|it) (delete|remove|ban)\b",
    r"\bclick (here|now)\b", r"\byou need to see this\b",
]

REAL_SIGNALS: List[str] = [
    r"\baccording to\b", r"\bsaid in a statement\b", r"\bconfirmed by\b",
    r"\breported by\b", r"\bspokesperson\b", r"\bofficial\b",
    r"\bapproximately\b", r"\ban estimated\b", r"\bdata shows\b",
    r"\bpeer.?reviewed\b", r"\bpublished in\b", r"\bthe study found\b",
    r"\bresearchers (at|from)\b", r"\buniversity of\b",
    r"\b(january|february|march|april|may|june|july|"
    r"august|september|october|november|december)\s+\d{1,2}\b",
    r"\b(president|senator|minister|secretary|commissioner)\b",
    r"\b(fbi|cia|cdc|who|un|nato|fda|epa|nhs)\b",
]

BIAS_PATTERNS: dict = {
    "Emotionally charged language": [
        r"\boutrage\b", r"\bfurious\b", r"\bterror\b",
        r"\brage\b", r"\bscandal\b", r"\bhorror\b",
    ],
    "Missing attribution": [
        r"\bthey say\b", r"\bsome say\b",
        r"\bpeople believe\b", r"\bit is said\b",
    ],
    "One-sided framing": [
        r"\balways\b", r"\bnever\b", r"\beveryone\b", r"\bnobody\b",
    ],
    "Appeal to fear": [
        r"\bdanger\b", r"\bthreat\b", r"\bcrisis\b",
        r"\bdisaster\b", r"\bcatastroph\b", r"\bemergency\b",
    ],
    "Hasty generalization": [
        r"\bproves that\b", r"\bclearly\b", r"\bobviously\b",
    ],
}

POSITIVE_WORDS = {
    "good", "great", "excellent", "positive", "success", "benefit",
    "improve", "hope", "helpful", "support", "safe", "healthy",
    "effective", "trusted", "confirmed", "advance", "progress",
}
NEGATIVE_WORDS = {
    "bad", "terrible", "dangerous", "threat", "fail", "crisis",
    "attack", "corrupt", "lie", "fraud", "fake", "false", "wrong",
    "evil", "destroy", "collapse", "disaster", "cover", "hide",
}


# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Core Heuristic Functions
# ─────────────────────────────────────────────────────────────────────────────

def _count_hits(text: str, patterns: List[str]) -> Tuple[int, List[str]]:
    hits: List[str] = []
    for pattern in patterns:
        hits.extend(re.findall(pattern, text, re.IGNORECASE))
    return len(hits), hits


def _credibility_score(text: str) -> float:
    words = text.split()
    word_count = max(len(words), 1)
    fake_hits, _ = _count_hits(text, FAKE_SIGNALS)
    real_hits, _ = _count_hits(text, REAL_SIGNALS)
    fake_tf = fake_hits / word_count
    real_tf = real_hits / word_count
    score = 50.0
    score -= fake_tf * 35_000
    score += real_tf * 25_000
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    if caps_ratio > 0.15:
        score -= 10.0
    if text.count("!") / word_count > 0.05:
        score -= 8.0
    if word_count > 200:
        score += 5.0
    if word_count > 500:
        score += 5.0
    return round(max(0.0, min(100.0, score)), 1)


def _verdict_and_confidence(score: float, fake_hits: int) -> Tuple[str, float]:
    if score <= 25:
        return "FAKE", round(min(60 + (25 - score) * 1.5, 96.0), 1)
    elif score <= 45:
        return "MISLEADING", round(min(55 + fake_hits * 3, 96.0), 1)
    elif score <= 65:
        return "UNCERTAIN", round(min(45 + abs(score - 55), 96.0), 1)
    else:
        return "REAL", round(min(60 + (score - 65) * 1.5, 96.0), 1)


def _extract_keywords(text: str) -> List[str]:
    _, hits = _count_hits(text, FAKE_SIGNALS)
    seen: set = set()
    out: List[str] = []
    for h in hits:
        key = h.strip().lower()
        if key not in seen and len(key) > 2:
            seen.add(key)
            out.append(h.strip())
    return out[:8]


def _detect_bias(text: str) -> List[str]:
    found: List[str] = []
    for label, patterns in BIAS_PATTERNS.items():
        count, _ = _count_hits(text, patterns)
        if count > 0:
            found.append(label)
    return found


def _compute_sentiment(text: str) -> Tuple[str, float]:
    words = re.findall(r'\b[a-z]+\b', text.lower())
    if not words:
        return "neutral", 0.0
    pos = sum(1 for w in words if w in POSITIVE_WORDS)
    neg = sum(1 for w in words if w in NEGATIVE_WORDS)
    if pos + neg == 0:
        return "neutral", 0.0
    raw = (pos - neg) / max(len(words), 1) * 10
    score = round(max(-1.0, min(1.0, raw)), 3)
    if score > 0.05:
        return "positive", score
    elif score < -0.05:
        return "negative", score
    return "neutral", score


def _build_local_explanation(
    verdict: str, score: float, fake_hits: int, real_hits: int,
    keywords: List[str], bias: List[str],
) -> str:
    if verdict == "FAKE":
        kw = f" Flagged phrases: {', '.join(keywords[:3])}." if keywords else ""
        b = f" Bias patterns: {', '.join(bias[:2])}." if bias else ""
        return (
            f"This content scores {score}/100 for credibility and contains {fake_hits} "
            f"misinformation signal(s) with little journalistic sourcing.{kw}{b} "
            f"Treat with high scepticism and verify via trusted sources."
        )
    elif verdict == "MISLEADING":
        return (
            f"This content (score: {score}/100) contains {fake_hits} concerning signal(s) "
            f"suggesting partial truths, missing context, or emotionally manipulative framing. "
            f"Cross-reference with reputable news sources before accepting these claims."
        )
    elif verdict == "REAL":
        return (
            f"This content scores {score}/100 and exhibits {real_hits} journalistic marker(s) "
            f"such as proper attribution and precise language. "
            f"It does not show common misinformation patterns, though independent "
            f"verification is always recommended."
        )
    return (
        f"This content is ambiguous (score: {score}/100) with {fake_hits} misinformation "
        f"and {real_hits} credibility signal(s). Manual fact-checking is recommended."
    )


def _run_stage1(text: str) -> dict:
    """Run the full local heuristic pipeline. Always sets ai_enhanced=False."""
    score = _credibility_score(text)
    fake_hits, _ = _count_hits(text, FAKE_SIGNALS)
    real_hits, _ = _count_hits(text, REAL_SIGNALS)
    verdict, confidence = _verdict_and_confidence(score, fake_hits)
    keywords = _extract_keywords(text)
    sentiment, sent_score = _compute_sentiment(text)
    bias_indicators = _detect_bias(text)
    explanation = _build_local_explanation(
        verdict, score, fake_hits, real_hits, keywords, bias_indicators
    )
    return {
        "verdict": verdict,
        "confidence": confidence,
        "credibility_score": score,
        "explanation": explanation,
        "keywords": keywords,
        "sentiment": sentiment,
        "sentiment_score": sent_score,
        "bias_indicators": bias_indicators,
        "ai_enhanced": False,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — OpenAI Enrichment
# ─────────────────────────────────────────────────────────────────────────────

_OPENAI_SYSTEM = (
    "You are TruthLens, an expert AI fact-checker. "
    "You will receive a news article or claim along with a preliminary "
    "automated credibility analysis. Your job is to review the content and "
    "provide a refined, expert-level assessment. "
    "Respond ONLY with a valid JSON object — no markdown, no extra text."
)

_OPENAI_USER_TEMPLATE = """Analyse the following content for credibility and misinformation.

CONTENT:
\"\"\"
{content}
\"\"\"
{url_context}

PRELIMINARY AUTOMATED ANALYSIS:
  • Credibility score : {score}/100
  • Verdict           : {verdict}
  • Confidence        : {confidence}%
  • Flagged signals   : {fake_hits} misinformation signal(s), {real_hits} credibility signal(s)
  • Suspicious phrases: {keywords}
  • Bias patterns     : {bias}

DECISION RULES:
- Classify as REAL if the claim is realistic, plausible, and consistent with normal real-world events, even when a source URL is not provided.
- Classify as FAKE if the claim is impossible, fabricated, scientifically false, or highly implausible.
- Classify as MISLEADING if the claim may contain partial truth, missing context, exaggeration, or manipulative framing.
- Classify as UNCERTAIN only when there is not enough information to reasonably judge the claim.
- Do not choose UNCERTAIN for ordinary plausible news-style statements just because they lack a source URL.
- For product launches, politics, economy, weather, public policy, sports, and normal business announcements, prefer REAL when the statement is plausible and not internally contradictory.

Respond with ONLY this JSON:
{{
  "verdict": "FAKE" | "MISLEADING" | "REAL" | "UNCERTAIN",
  "confidence": <integer 0-100>,
  "credibility_score": <integer 0-100>,
  "explanation": "<2-3 sentence professional explanation citing specific evidence from the text>",
  "suspicious_phrases": ["<phrase>", ...],
  "sentiment": "positive" | "negative" | "neutral",
  "sentiment_score": <float -1.0 to 1.0>,
  "bias_indicators": ["<label>", ...]
}}"""


async def _run_stage2_openai(
    text: str,
    source_url: Optional[str],
    stage1: dict,
) -> Optional[dict]:
    """
    Call OpenAI GPT-4o-mini to enrich the Stage 1 result.
    Returns enriched dict on success, or None on any failure.
    Never raises.
    """
    try:
        from openai import AsyncOpenAI
        from ..core.config import settings

        api_key = (settings.OPENAI_API_KEY or "").strip()
        if not api_key or api_key.startswith("sk-your"):
            return None  # Key not configured — skip Stage 2

        client = AsyncOpenAI(api_key=api_key, timeout=15.0)

        fake_hits, _ = _count_hits(text, FAKE_SIGNALS)
        real_hits, _ = _count_hits(text, REAL_SIGNALS)
        url_context = f"SOURCE URL: {source_url}\n" if source_url else ""

        prompt = _OPENAI_USER_TEMPLATE.format(
            content=text[:3000] + ("\n[truncated]" if len(text) > 3000 else ""),
            url_context=url_context,
            score=stage1["credibility_score"],
            verdict=stage1["verdict"],
            confidence=stage1["confidence"],
            fake_hits=fake_hits,
            real_hits=real_hits,
            keywords=", ".join(stage1["keywords"]) or "none",
            bias=", ".join(stage1["bias_indicators"]) or "none",
        )

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": _OPENAI_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.1,
            max_tokens=600,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content.strip()
        data = json.loads(raw)

        # Validate and sanitise
        valid_verdicts = {"FAKE", "REAL", "MISLEADING", "UNCERTAIN"}
        verdict = str(data.get("verdict", stage1["verdict"])).upper()
        if verdict not in valid_verdicts:
            verdict = stage1["verdict"]

        confidence = max(0.0, min(100.0, float(data.get("confidence", stage1["confidence"]))))
        cred_score = max(0.0, min(100.0, float(data.get("credibility_score", stage1["credibility_score"]))))
        sent_score = max(-1.0, min(1.0, float(data.get("sentiment_score", stage1["sentiment_score"]))))

        sentiment = str(data.get("sentiment", stage1["sentiment"])).lower()
        if sentiment not in {"positive", "negative", "neutral"}:
            sentiment = stage1["sentiment"]

        ai_keywords = data.get("suspicious_phrases", stage1["keywords"])
        keywords = [str(k) for k in ai_keywords if k][:8] if ai_keywords else stage1["keywords"]

        bias_indicators = data.get("bias_indicators", stage1["bias_indicators"])
        if not isinstance(bias_indicators, list):
            bias_indicators = stage1["bias_indicators"]

        explanation = str(data.get("explanation", stage1["explanation"]))
        if not explanation or len(explanation) < 20:
            explanation = stage1["explanation"]

        return {
            "verdict": verdict,
            "confidence": round(confidence, 1),
            "credibility_score": round(cred_score, 1),
            "explanation": explanation,
            "keywords": keywords,
            "sentiment": sentiment,
            "sentiment_score": round(sent_score, 3),
            "bias_indicators": bias_indicators,
            "ai_enhanced": True,
        }

    except json.JSONDecodeError as e:
        logger.warning("OpenAI returned invalid JSON — using local result. Error: %s", e)
        return None
    except Exception as e:
        err_str = str(e).lower()
        if "authentication" in err_str or "api_key" in err_str:
            logger.warning("OpenAI authentication failed — check OPENAI_API_KEY")
        elif "rate" in err_str:
            logger.warning("OpenAI rate limit reached — using local result")
        elif "timeout" in err_str:
            logger.warning("OpenAI request timed out — using local result")
        else:
            logger.warning("OpenAI enrichment failed (%s) — using local result", type(e).__name__)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

async def analyze_content(content: str, source_url: str = None) -> dict:
    """
    Main entry point called by the /analyze router.
    Always returns a complete result dict with ai_enhanced field.
    """
    if not content or len(content.strip()) < 20:
        return {
            "verdict": "UNCERTAIN",
            "confidence": 0.0,
            "credibility_score": 50.0,
            "explanation": "Content is too short to analyse. Please provide at least 20 characters.",
            "keywords": [],
            "sentiment": "neutral",
            "sentiment_score": 0.0,
            "bias_indicators": [],
            "ai_enhanced": False,
        }

    text = content.strip()

    # Stage 1 — always runs
    stage1_result = _run_stage1(text)

    # Stage 2 — OpenAI enrichment (graceful fallback on any failure)
    stage2_result = await _run_stage2_openai(text, source_url, stage1_result)

    if stage2_result is not None:
        logger.info(
            "Analysis complete [AI] verdict=%s score=%s",
            stage2_result["verdict"], stage2_result["credibility_score"],
        )
        return stage2_result

    logger.info(
        "Analysis complete [local] verdict=%s score=%s",
        stage1_result["verdict"], stage1_result["credibility_score"],
    )
    return stage1_result
