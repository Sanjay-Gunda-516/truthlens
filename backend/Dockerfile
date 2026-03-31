# ─────────────────────────────────────────────────────────────────────────────
# TruthLens — Backend Dockerfile
# Multi-stage build keeps the final image lean (~200MB instead of ~1GB).
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: dependency builder ───────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build tools for packages that compile C extensions (psycopg2, bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install to a local prefix so we can copy them cleanly in the next stage
RUN pip install --upgrade pip \
 && pip install --prefix=/install --no-cache-dir \
    # Exclude test dependencies from the production image
    $(grep -v "^pytest" requirements.txt | grep -v "^#" | grep -v "^$")

# ── Stage 2: production runtime ───────────────────────────────────────────────
FROM python:3.11-slim AS runtime

# Non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Bring in compiled packages from builder stage
COPY --from=builder /install /usr/local

# Copy application source
COPY app/ ./app/

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# ── Health check ──────────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# ── Production startup command ────────────────────────────────────────────────
# Gunicorn manages 2 uvicorn workers.
# Tune WEB_CONCURRENCY via environment variable (defaults to 2).
CMD ["sh", "-c", \
  "gunicorn app.main:app \
   -k uvicorn.workers.UvicornWorker \
   -w ${WEB_CONCURRENCY:-2} \
   -b 0.0.0.0:8000 \
   --timeout 120 \
   --keep-alive 5 \
   --log-level info \
   --access-logfile - \
   --error-logfile -"]
