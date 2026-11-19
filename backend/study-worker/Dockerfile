FROM python:3.12-slim-bookworm

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 \
    TOKENIZERS_PARALLELISM=false OMP_NUM_THREADS=2 \
    STUDY_EMBEDDING_HOST=0.0.0.0 HF_HOME=/home/study/.cache/huggingface
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      tesseract-ocr tesseract-ocr-eng libgomp1 ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 study \
    && mkdir -p /home/study/.cache/huggingface \
    && chown -R study:study /home/study/.cache

# CPU wheels include Linux arm64 for this runtime. No x86-only OCR package or CUDA.
COPY requirements.txt .
RUN pip install --no-cache-dir torch==2.6.0 --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt
COPY --chown=study:study study_worker ./study_worker
USER study
EXPOSE 8091
CMD ["python", "-m", "study_worker", "work"]

