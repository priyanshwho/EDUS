"""Optional real CPU-model check. Downloads public weights, never calls Groq/S3."""
import json
import math
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from study_worker.config import Settings
from study_worker.core import Page
from study_worker.embeddings import Embedder


def main():
    model = Embedder(Settings.from_env())
    texts = [
        "Deadlock occurs when processes wait for resources held by one another.",
        "Photosynthesis converts light energy into chemical energy in plants.",
    ]
    vectors = model.embed(texts)
    query = model.embed(["Why do processes get stuck waiting for each other?"], "query")[0]
    scores = [sum(a * b for a, b in zip(query, vector)) for vector in vectors]
    assert scores[0] > scores[1], "The relevant passage did not rank first"
    chunks = model.chunks("00000000-0000-4000-8000-000000000001", [Page(1, " ".join(texts) * 80, "native")])
    assert chunks and max(chunk["tokens"] for chunk in chunks) <= 450
    print(json.dumps({"dimension": len(query), "query_norm": math.sqrt(sum(x*x for x in query)),
                      "relevant_document_ranked_first": True, "chunks": len(chunks),
                      "revision": model.settings.embedding_revision}))


if __name__ == "__main__":
    main()
