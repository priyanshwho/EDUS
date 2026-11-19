# EduSphere: RAG Interview Preparation

**A practical guide for explaining your project, understanding its architecture, and answering technical questions**

Prepared from the EduSphere repository and its recorded Operating Systems demo. Review the code and confirm the current deployment before making claims about it. The user reports approximately 600+ users; verify whether this means registered or active users and the measurement date before quoting it.

## How to use this guide

First read the project pitch and the two diagrams. Then follow the deadlock example and learn the first 15 questions. Use the remaining questions for deeper follow-ups. The wording is a starting point: explain it in your own words and be honest about what you personally implemented, tested, and understood.

**Critical truth:** EduSphere downloads a pretrained Hugging Face model and uses it to generate embeddings. Uploading a document does not train or fine-tune that model. Do not claim otherwise.

## 1. What is EduSphere?

EduSphere is an academic platform for students, professors, and administrators. It brings together academic resources and Edu AI study features. A student can browse the shared subject catalog by branch and semester, while the private study feature lets an individual upload a syllabus, notes, or pasted text and ask questions about their own material.

The private study feature is the RAG feature discussed here. It turns documents into searchable passages, retrieves relevant passages for a question, and supplies them to a language model to help it answer with references. The shared syllabus catalog and private study workspaces are different features; do not claim that every part of Edu AI uses this RAG pipeline.

### A 30-second introduction

“EduSphere is an academic platform for students, professors, and administrators. Edu AI has two study paths. Students can select an existing CSE or IT syllabus by semester and subject, choose chapters, and practice MCQs, revise flashcards, or learn with an AI tutor. They can also upload private notes or a syllabus for RAG-based study with source references. The RAG path uses local E5 embeddings, PostgreSQL with pgvector and keyword search, and a Groq-hosted generation model.”

If verified, add: “The platform has around 600 registered users.” Do not equate that figure with active users, RAG users, or concurrent users without evidence.

### A two-minute explanation

“EduSphere helps students find academic resources and study their course material in one place. In Edu AI, users can select a branch such as CSE or IT, a semester, a subject, and the relevant syllabus section or chapter. They can generate MCQs at different difficulty levels, review flashcards, or use a tutor that teaches topic by topic and asks checkpoint questions. There is also a free-discussion mode. This makes the existing syllabus useful for active practice without requiring every student to upload it again.

“The private study library addresses a different need: a student's own notes, scanned pages, or syllabus. The user adds a PDF or pasted text to a private subject workspace. A background worker extracts the text, performs OCR where needed, and creates page-aware chunks. A pretrained E5 model running locally on CPU generates 384-dimensional vectors. PostgreSQL stores the chunks and vectors with pgvector, while private object storage keeps the original PDFs.

“At question time, the backend checks ownership and searches only the authorized material. It combines vector similarity with keyword search, supplies selected passages to Groq, and returns an answer with available source references. The private library also supports source-grounded flashcards and MCQs. The two paths share the product goal of helping students learn, but the catalog path uses selected topics and supplied notes directly, whereas the private RAG path retrieves indexed passages. Neither approach trains a model on the student's upload.”

Be prepared for: “What exactly did you personally build?” Give your own truthful contribution, not a claim of sole authorship unless it is accurate.

### Edu AI feature map: what a student can actually do

- **Choose an existing syllabus:** browse CSE or IT, choose a semester and subject, then Section A, Section B, or the full syllabus. The catalog organizes the supplied syllabus content into chapters and topics.
- **Practice MCQs:** choose a chapter and difficulty. The backend prompts the model for questions, four answer options, a correct answer, and explanations. Generated questions can still be wrong and need quality checks.
- **Revise flashcards:** generate question-and-answer cards from the selected chapter's notes when available, otherwise from topics and general subject knowledge.
- **Use AI tutoring:** step-by-step mode teaches topics in order, asks a comprehension question, and waits for the student. Free-discussion mode lets the student ask questions about the chapter. The interface includes a talking avatar, transcript, and browser-dependent speech controls; these do not train the language model.
- **Practice exam-style questions:** the feature labeled “PYQ Exam” currently generates questions from syllabus content. It should be described as generated exam practice; the implementation does not establish that these are authentic past papers or that historical exam patterns were analyzed.
- **Study private material with RAG:** upload a syllabus, notes, both, or paste text. Ask questions and generate practice items using retrieved private passages and source references.

### The two learning workflows

**Existing syllabus:** branch -> semester -> subject -> syllabus section -> chapter/topics -> MCQs, flashcards, AI tutor, or exam-style practice.

**Private RAG:** private subject -> PDF or pasted text -> extraction/OCR -> chunks and embeddings -> authorized retrieval -> sourced chat, flashcards, or MCQs.

The existing syllabus service reads the shared catalog and applicable database or file-backed syllabus content. For chapter practice, the frontend supplies the selected topics and available chapter notes to the AI endpoints. The tutor streams text responses using server-sent events. This path does not invoke the private workspace's pgvector retrieval pipeline. In private RAG, source-only mode constrains the task to retrieved evidence; general-tutor mode may also use general knowledge.

### Interview follow-up: “Is all Edu AI based on RAG?”

“No. Edu AI includes syllabus-driven generation and tutoring as well as private document RAG. Selecting a known chapter gives us structured topics and optionally chapter notes directly. The private library needs search because it must find useful passages within uploaded documents. I would explain the actual data flow for each rather than call every model prompt RAG.”

## 2. Concepts before architecture

- **RAG:** Retrieval-augmented generation. Retrieve relevant information first, then give it to a generative model as context.
- **Token:** A piece of text processed by a model. One token is not always one word.
- **Chunk:** A bounded passage from a document, stored with its source and page information.
- **Embedding:** A list of numbers representing a piece of text in a learned semantic space. Similar meanings often have nearby representations, but similarity is not proof of correctness.
- **Vector database:** A system that stores and searches vectors. Here PostgreSQL becomes vector-capable through the pgvector extension; it also stores ordinary relational data.
- **OCR:** Optical character recognition, converting text in an image into machine-readable text.
- **Context:** The retrieved text and instructions sent to the language model to answer a question.
- **Citation:** A reference connecting an answer to a source. It still needs inspection: a valid reference identifier does not prove the passage supports the claim.
- **ANN:** Approximate nearest-neighbor search, a faster search approach that can trade some recall for speed.

## 3. Architecture at a glance

### Document ingestion: preparing material for search

:::ingestion-diagram

The PDF remains in private object storage. Extracted text and vectors are stored in PostgreSQL. Pasted text bypasses PDF extraction and OCR. Page images are used temporarily during extraction rather than treated as permanent public files by default.

### Answering: retrieval plus generation

:::question-diagram

The Python embedding service is internal. The Express backend supplies owner and workspace constraints to the retrieval query. Groq receives the question and selected passages for generation; vision OCR can send selected page images to Groq. Therefore “private to the account” does not mean that every operation is fully offline.

### The components and why they exist

- **React frontend:** workspace, uploads, source selection, chat, and display of references.
- **Node.js / Express API:** authentication, authorization, validation, quotas, storage coordination, retrieval, and model requests.
- **Tigris S3-compatible object storage:** original private PDF objects; database rows store their metadata and state.
- **PostgreSQL / Neon and pgvector:** users, workspaces, document metadata, jobs, extracted pages, searchable chunks, vectors, and usage counters. The existing PostgreSQL system avoids adding another vector service for this bounded workload.
- **Python worker:** processes queued documents, extracts text, runs OCR, chunks and embeds content, and publishes results.
- **Local E5 embedding model:** generates compatible document and question vectors on CPU. “Local” means hosted on the project's server, not inside the user's browser.
- **Groq API:** serves the configured language model for generation and a vision model for difficult pages. The repository default is `openai/gpt-oss-120b` for text and `qwen/qwen3.8-27b` for vision; verify current configuration and free-tier availability before claiming those models are currently active.

## 4. Follow one real example

A private Operating Systems recruiter demo was tested with a Brooklyn College syllabus and University of Victoria deadlock notes. A question asked for the four necessary conditions for deadlock. The system retrieved relevant notes and returned an answer citing the notes on page 3. Another test asked for office hours and received an answer tied to page 2 of the syllabus; this is a useful example of document-specific information a generic model should not be expected to know.

The recorded checks also included a resource-allocation graph question and a question outside the supplied materials, for which the system returned insufficient evidence. Four cases passed in that recorded run. This is a small demonstration, not a statistically valid accuracy benchmark. A separate test exercised the vision path with a synthetic printed page; it does not establish handwritten OCR accuracy. Free-tier capacity or configuration may differ when you demonstrate it.

**Demo sequence:** sign in to the owning account, open “Operating Systems — Recruiter Demo,” select the notes and a source-grounded mode, ask for the deadlock conditions, and open the cited page. Then ask for office hours from the syllabus. Finally ask an unrelated question in source-only mode and show that the system should indicate insufficient evidence. If anything fails, say what failed instead of inventing a result.

## 5. Thirty interview questions and answers

### 1. Why did you use RAG for EduSphere?

A general language model does not automatically know a student's particular syllabus, current class notes, or course-specific terminology. RAG makes the user's uploaded material available at question time and can attach page references. It also lets the user change documents without retraining the model. The tradeoff is that answer quality depends on extraction, retrieval, context selection, and generation; RAG reduces some problems but does not eliminate hallucinations.

### 2. Walk me through the complete workflow.

After authorization and upload validation, the API stores a PDF privately and creates a durable job. A worker extracts or recognizes text, makes page-aware chunks, embeds them, and stores the results in PostgreSQL. At query time the API checks the owner and selected sources, embeds the question using the same model, retrieves semantic and keyword candidates, fuses their rankings, and sends a bounded selection to Groq. The response is checked for valid source identifiers and returned to the frontend with available references.

### 3. Why have a background worker?

PDF parsing, OCR, and embeddings can take much longer than a normal web request. A durable PostgreSQL job lets the API accept work and show processing status while a separate Python process handles CPU and model dependencies. The worker uses leases, heartbeats, retry limits, and `FOR UPDATE SKIP LOCKED` for coordinated claiming. These help recover from crashes and avoid two workers treating the same job as theirs; they do not make external dependencies infallible.

### 4. How do you handle selectable and scanned PDFs?

For selectable text the worker uses `pypdf` to extract text per page. For pages needing image-based extraction it renders a page using PDFium and attempts English Tesseract OCR. Difficult pages may use Groq vision, subject to quotas and configuration. Page-level extraction metadata matters because PDFs can mix native text and images, and OCR can be incomplete or incorrect.

### 5. Can it read handwriting?

The pipeline has a vision-assisted path intended for difficult and handwritten pages, but handwriting quality varies with lighting, handwriting, layout, diagrams, and equations. The recorded live vision test used a synthetic printed page routed through that path, not a representative handwritten benchmark. Say “the architecture supports an attempt at handwritten OCR; accuracy needs evaluation on real examples,” not “it reads all handwriting accurately.”

### 6. What happens when OCR fails or reaches a limit?

Some pages can remain unavailable or be marked partial; successful native text or reliable extracted text may still be usable. Successful vision readings can be cached for retries. Limits protect shared capacity, but a user should be told when extraction is incomplete. A partially indexed document can produce incomplete answers; the user should check the original and retry when appropriate.

### 7. Why chunk documents instead of embedding a whole PDF?

A full PDF can exceed an embedding model's input limit and combine unrelated topics in one vector. Smaller passages preserve topical specificity and allow the answer to cite a relevant page. This implementation keeps PDF chunks within a page, uses a maximum of 450 model tokens including the E5 prefix and special tokens, and overlaps neighboring chunks by 50 tokens. The model has a 512-token maximum; the smaller chunk bound provides room within it. These values are implementation choices that should be evaluated, not universal optima.

### 8. What is an embedding in simple terms?

It is a numerical representation of text produced by a model. The model maps passages and questions into a shared 384-dimensional space so that related meanings can be compared. For example, a question about a process waiting forever might be close to a passage discussing deadlock even if the exact words differ. Embeddings compress meaning imperfectly: close vectors do not guarantee that one passage actually answers the question.

### 9. How does the E5 model create an embedding?

The tokenizer turns text into model tokens. A transformer produces contextual token representations; the sentence-transformer model pools them into a fixed-size vector and the implementation normalizes it. Documents use the `passage: ` prefix and questions use `query: ` because E5 expects these task cues. The result is a 384-dimensional representation, not a generated natural-language answer.

### 10. Why use multilingual E5 small?

`intfloat/multilingual-e5-small` is a pretrained compact multilingual embedding model that can run on the server's CPU and output 384-dimensional vectors. It avoids an embedding API call for every chunk and question, keeps those embedding computations local, and fits a project with modest resources. A larger model may improve quality but require more memory or time. This model was selected as a practical tradeoff; the project does not establish that it is the best model without comparative evaluation.

### 11. Did you train or fine-tune the model?

No. EduSphere uses an existing pretrained model from Hugging Face for inference and pins a specific revision. The model authors performed its training; adding user documents creates embeddings and database records but does not update model weights. Correct phrasing: “We integrated a pretrained E5 model and indexed our users' documents.” Fine-tuning would require a training dataset, loss function, optimizer, evaluation, and an actual weight-update process.

### 12. What is the difference between the embedding model and the LLM?

E5 converts text into vectors to help select relevant passages. The Groq-served language model generates the answer from instructions, conversation context, and retrieved passages. They perform different tasks and can be changed independently, although changing the embedding model requires re-embedding stored chunks and using a compatible query encoder.

### 13. How is similarity calculated?

Cosine similarity is `(q · d) / (||q|| ||d||)`. With normalized nonzero vectors, it equals their dot product. Cosine distance is `1 - cosine similarity`, so smaller distance means greater similarity. In a simple two-dimensional illustration, `(1, 0)` and `(0.8, 0.6)` have similarity 0.8 and distance 0.2. Real EduSphere vectors have 384 dimensions; their individual numbers are not human-readable meanings.

### 14. Where exactly are the vectors stored?

Each searchable chunk has text and metadata such as its document and page, plus a pgvector `vector(384)` column in PostgreSQL. Extracted pages, workspaces, jobs, document status, and usage information are stored in related tables. The original PDF is in private object storage. A 384-dimensional float32 payload is about 1,536 bytes before database overhead, metadata, indexes, and storage alignment; it is not the full cost of a chunk.

### 15. How does PostgreSQL search vectors?

The pgvector extension provides a vector type and distance operators. The retrieval query compares the embedded question against eligible stored vectors using cosine distance and ranks the nearest results. The implementation filters to the authorized workspace and eligible documents as part of the query. In this version, there is no HNSW or IVFFlat vector index: vector search is exact over the eligible corpus, while PostgreSQL full-text search has a GIN index.

### 16. Why pgvector instead of Pinecone or Qdrant?

EduSphere already relies on PostgreSQL for accounts, workspaces, and metadata. pgvector keeps relational filters, vectors, and keyword search near that existing data, reducing infrastructure and synchronization for a relatively small, per-user corpus. Pinecone or Qdrant may be attractive for larger dedicated vector workloads, managed operations, or particular search features. The tradeoff is that vector workloads compete with the main database, and scaling must be measured. Neither alternative is inherently insecure or unsuitable.

### 17. What are HNSW and IVFFlat, and why not use them now?

They are approximate vector indexes available in pgvector. HNSW builds a navigable proximity graph; IVFFlat partitions vectors into lists and searches selected lists. Both can reduce latency for large datasets at a recall, memory, build-time, or tuning cost. The present code uses exact search for the filtered corpus, which is simpler at current bounded scale. Benchmark p95 latency and recall as data grows before choosing an index. An HNSW graph is an index structure, not GraphRAG.

### 18. Why combine semantic and keyword search?

Semantic search can match related phrasing, while keyword search can preserve exact terminology, acronyms, and course-specific strings that an embedding might miss. EduSphere retrieves up to 24 candidates from each method, then combines the rankings. Its lexical path uses PostgreSQL full-text search and `ts_rank_cd`; it is not BM25. One method can return no matches while the other still contributes.

### 19. How does reciprocal rank fusion work?

For each candidate, RRF adds `1 / (60 + rank)` for each ranked list in which it appears. A passage ranked highly by both methods tends to rise, without trying to compare cosine scores directly with text-search scores. For example, a passage ranked first in both lists receives `1/61 + 1/61`. The implementation keeps up to 16 fused candidates, removes duplicate text, and packs up to 8 excerpts within character budgets. RRF is rank fusion, not a trained cross-encoder reranker.

### 20. How are users' documents kept private?

The API authenticates the user and applies owner, workspace, selected-document, and readiness checks to retrieval. Source metadata is kept alongside the chunk so references can be checked. Original PDFs are private objects accessed with short-lived signed URLs. These are application-level checks; do not claim database row-level security unless you have separately verified it. A signed link already issued can remain usable until expiry, and vectors are not encryption.

### 21. How do source references work?

The selected passages receive identifiers such as S1, with their associated document and page. The model is instructed to reference supplied sources, and the backend validates returned source identifiers against those it actually provided. A valid identifier establishes that the reference exists in the supplied context; it does not prove that every sentence is supported by that passage. Source inspection and claim-level evaluation remain important.

### 22. Does RAG eliminate hallucinations?

No. A relevant passage may not be retrieved, OCR may misread it, the model may infer too much, or it may cite a passage that does not entail a claim. A source-only mode instructs the model to use the provided material and return insufficient evidence when appropriate. The general-tutor mode can add general explanations. These controls reduce risk but do not mathematically guarantee grounded answers.

### 23. Why RAG rather than fine-tuning?

RAG injects changing private material at query time and preserves source links without updating model weights. Fine-tuning changes model behavior through training and can help with a stable task or style, but it is not a reliable substitute for access to up-to-date, user-specific facts or citations. They can be combined if evaluation supports it. This project currently uses RAG and pretrained models, not project-specific fine-tuning.

### 24. Why not GraphRAG?

GraphRAG builds representations of entities and relationships, and often summaries, to support questions spanning many related documents or broad themes. For private course notes and page-specific questions, the existing chunk-based hybrid search is simpler and cheaper to operate; graph extraction adds indexing, maintenance, and potential OCR-induced entity errors. Consider GraphRAG when measured failures involve cross-document relationships or multi-hop and global questions. Do not claim it is always worse: compare quality, latency, and cost on a representative dataset.

### 25. What happens if retrieval finds weak or irrelevant passages?

Nearest-neighbor search can return the closest available passages even when none truly answers the question. The current approach relies on retrieval, bounded context, prompts, and source-only insufficient-evidence behavior; do not claim a calibrated similarity threshold or a trained reranker unless added and verified. Improve it with labeled negative questions, confidence calibration, reranking, or other abstention checks, then measure both missed answers and unsupported answers.

### 26. What are the limits and cost controls?

Repository defaults include six subjects per account; one syllabus up to 5 MiB and 30 pages; up to five notes PDFs, each up to 20 MiB and 150 pages; 50 MiB per subject and 300 MiB per account. Upload attempts, daily bytes, concurrency, pasted text, and vision usage are also bounded. Runtime settings may override defaults. Local E5 avoids a per-request embedding API charge but still consumes server CPU and memory; Groq free usage has changing quotas and is not unlimited.

### 27. How would you evaluate a RAG system?

Create a labeled set of realistic questions, relevant passages, expected answers, and questions with no answer. Measure retrieval precision@k, recall@k, MRR or nDCG; measure answer correctness, citation support, and abstention separately; measure OCR character error rate on transcribed samples. Also track p50/p95 latency, failures, throughput, and resource usage. Split results by selectable PDFs, scans, real handwriting, and question type. The four demo cases are smoke tests, not a claim of overall accuracy.

### 28. What happens when a document is deleted or a worker crashes?

Document and chunk lifecycle must remain consistent with the private object and queued jobs. Jobs use leases and heartbeats; retry and fenced publication logic help stop stale workers from publishing results after their authority has expired or a document has changed. The application rechecks relevant source state after generation to reduce deletion races. Distributed deletion and already-issued URLs have timing limits, so discuss observed behavior rather than promising instantaneous revocation everywhere.

### 29. How do you handle prompt injection and data privacy?

A document may contain instructions such as “ignore previous instructions.” The prompt treats retrieved content and conversation history as untrusted data, and the backend limits which source IDs can be returned. This is defense in depth, not proof against every injection. PDF contents are private to the account in the application, but selected passages and some OCR images can be sent to Groq. Secrets such as the Groq key, database URL, storage credentials, and internal-service token belong on the server, never in browser code.

### 30. What would you improve for production scale?

First build a representative evaluation set and measure bottlenecks. Then consider better OCR quality checks, a reranker or calibrated abstention, queue and database observability, and vector indexes or dedicated vector infrastructure if measurements justify them. Test authorization isolation and deletion races, tune chunking and retrieval against labeled questions, and load test p95 latency and free-tier exhaustion. Any architecture change should follow evidence rather than trends.

## 6. Deeper follow-up drill

**What is top-k?** The maximum number of candidates selected at a retrieval stage. Larger k can improve recall but may add noise, latency, and context cost. EduSphere's candidate and context limits are different stages.

**What is the context window?** The maximum input and output tokens supported by the generation model. EduSphere also applies its own smaller character budgets; characters and tokens are not interchangeable.

**Why the same embedding model for documents and queries?** They need a compatible vector space. EduSphere pins the E5 model revision and checks compatibility. On migration, re-embed existing chunks and verify the new index before switching queries.

**Are embeddings a database?** No. They are numerical representations. PostgreSQL with pgvector stores and searches them.

**Does pgvector generate embeddings?** No. The local E5 service generates vectors; pgvector stores and compares them.

**Are vectors anonymous?** Not necessarily. Embeddings can reveal information and should receive access controls and retention protections like other sensitive derived data.

**What does a GIN index do here?** It supports PostgreSQL full-text search over the generated text-search vector. It is distinct from an HNSW or IVFFlat vector index.

**How is a pasted note handled?** The text is saved as document content in PostgreSQL and processed into searchable chunks. It does not require storing a PDF or running image OCR.

**How do you prevent cross-user retrieval?** Apply and test owner and workspace filtering on every relevant operation, including retrieval, source access, deletion, and async work. Never trust a document ID just because the browser supplied it.

**Do you send the whole PDF to the language model?** For answering, the system sends a limited set of selected passages, not the complete PDF by default. Selected page images may be sent separately for vision OCR.

**What is RRF's main advantage?** It combines ordered rankings from different retrieval methods without assuming their raw scores are directly comparable.

**What is recall@k?** Relevant passages retrieved in the top k divided by all relevant passages identified in the labeled set. Precision@k is relevant passages in the top k divided by k.

**What is MRR?** Mean reciprocal rank: average `1 / rank` of the first relevant result across questions. It rewards finding at least one relevant passage early but does not capture all relevance.

**Can the model answer using general knowledge?** In general-tutor mode it can. In source-only mode it is instructed to ground answers in the uploaded material; inspect the actual response and sources rather than assuming perfect compliance.

**Is 600 users proof of RAG quality?** No. An adoption count is not a retrieval or answer-quality metric, and must not be presented as RAG usage without evidence.

## 7. Configuration, deployment, and tradeoffs

The server needs a PostgreSQL connection with pgvector available, private S3-compatible storage configuration, and a Groq API key for the configured generation and vision calls. The API and internal worker need their shared internal authentication configuration. The public Hugging Face embedding model normally does not require a personal API key to download, although server access to the model files and enough CPU/RAM are required. Never put credentials in the PDF or commit them to Git.

The owner confirmed their Groq organization is on the free plan with paid billing disabled. The project also has configuration and budget controls, but application settings cannot independently prove the account's billing plan. Provider model availability and quotas can change. Production requires matching migrations, running API and worker processes, valid secrets, reachable storage and database, and a working reverse proxy.

Tradeoffs to articulate: local embeddings offer predictable integration and avoid per-call embedding fees but add server resource and deployment burden; Groq offers hosted generation but introduces a network dependency, data processing by a third party, and quota limits; PostgreSQL consolidates services but can become a shared bottleneck; page-level chunking improves citations but may miss context spanning pages; overlap helps boundary recall but creates duplicate material; hybrid search helps different query types but adds tuning and evaluation work.

## 8. Debugging and testing scenarios

**Upload stays processing:** inspect API response and job status; verify worker process, lease, database, object storage, and logs. Check whether a model or OCR dependency is available. Do not assume the frontend is the cause.

**No relevant answer:** check document status and extraction quality, selected sources, example retrieved passages and their ranks, query embedding compatibility, lexical matches, context packing, and prompt. Check source-only versus general mode.

**Vision fails:** check page limits, free-tier quota, model availability, credentials, image rendering, and partial-processing state. A retry may reuse successful prior readings.

**A citation looks wrong:** inspect the chunk text and original page, verify page numbers and OCR, then compare the cited passage with the specific claim. Valid source IDs alone are insufficient.

**A user sees another user's result:** treat it as a serious authorization defect; reproduce with two test accounts and trace every owner and workspace predicate and source endpoint. Do not rely on UUID secrecy.

**Slow response:** separate upload, extraction, embedding, SQL retrieval, and Groq generation latency. Track p50/p95 and investigate the measured bottleneck before adding infrastructure.

## 9. Practice plan for tomorrow

1. Spend 15 minutes reading the 30-second pitch and diagrams. Explain ingestion and querying aloud without reading.
2. Spend 25 minutes on questions 1–15: extraction, chunking, embeddings, cosine similarity, and pgvector. Draw a small example of a question and two passages.
3. Spend 25 minutes on questions 16–30: hybrid retrieval, security, hallucinations, GraphRAG, evaluation, and scaling.
4. Spend 15 minutes rehearsing the real Operating Systems demo, opening the cited page and explaining what the small test proves and does not prove.
5. Spend 10 minutes on your personal contribution and one real challenge, the action you took, how it was tested, and what you would improve. Never invent a metric or a training run.

When you do not know an answer, say what you know, identify the uncertainty, and describe how you would verify it. That is stronger than presenting a guess as a fact.

## 10. Scaling interview: one million requests

### 31. How would you scale EduSphere to one million requests?

“I would first clarify the time period and request mix. One million total requests over a month is different from one million RAG generations per day or per second. I would measure today's latency and resource use, estimate peak traffic, separate ordinary API reads from document ingestion and generation, and scale the limiting components. I would not claim our current deployment has already handled that load.”

One million requests per day averages about **11.6 requests per second**: `1,000,000 / 86,400`. One million per 30-day month averages about **0.39 per second**. One million per second is an entirely different problem. Average load is not peak load: a chosen 10x peak assumption for the daily case implies about **116 requests per second**, which must be validated against observed traffic rather than treated as a fact.

### 32. How many concurrent requests and model calls would that mean?

Use Little's Law for a stable system: average work in progress is arrival rate multiplied by average time in the system. If all 11.6 requests per second require generation and average response time is 5 seconds, approximately **58 requests** are in progress on average. Under the illustrative 10x peak at the same response time, that is about **580**. Tail latency and burstiness require headroom. These figures are capacity examples, not measured EduSphere performance.

Suppose instead only 10% of one million daily requests are generations. Then there are 100,000 generation requests per day. Assuming 2,000 input and 300 output tokens per generation gives **200 million input tokens and 30 million output tokens per day**. These assumed token counts show why model throughput and cost can dominate; actual usage must be measured, and token throughput matters alongside request rate.

### 33. What would the scaled architecture look like?

Use a CDN for static frontend assets and a load balancer before multiple stateless API instances. Keep identity and authorization consistent across instances. Scale ingestion workers separately from the API and embedding-serving instances because OCR, embedding, and generation have different resource profiles. Use durable job coordination and shared rate-limit and quota state; a process-local limit cannot enforce a global quota across replicas.

For PostgreSQL, use bounded connection pools and monitor connections, query latency, CPU, I/O, and lock contention. Evaluate an ANN index when exact vector search becomes a measured bottleneck, testing recall and authorized filters together. Read replicas can help appropriate reads, but replication lag can make newly uploaded or deleted documents temporarily inconsistent; route sensitive reads appropriately. Move to dedicated vector infrastructure only if tested requirements outweigh the operational simplicity of pgvector.

The current PostgreSQL queue can be extended with worker replicas initially. A dedicated broker may become worthwhile for higher sustained job volume or more complex orchestration. Neither microservices nor a broker automatically solves insufficient generation capacity.

### 34. Can free Groq models support that scale?

“I would not promise it. Free plans have request and token limits and changing capacity. Under the project's free-only constraint, the safe choices are per-user limits, a bounded global concurrency budget, fair queueing where useful, and clear busy or quota-exhausted responses. Supporting a guaranteed large generation workload would require enough provisioned inference capacity, through a changed provider plan or appropriately funded self-hosting, and explicit approval to change the free-only requirement.”

Do not implement a paid fallback silently. Self-hosting an open model has infrastructure costs even when its weights are downloadable. Multiple API keys are not a capacity plan or a way to bypass provider limits. Capacity also depends on the provider's input and output token limits, not just requests per minute.

### 35. Would caching solve the problem?

Caching can reduce repeated work: static syllabus catalog reads, embeddings of repeated text, and already successful OCR are good candidates when versioning and authorization are correct. A private answer cache needs owner/workspace scope, selected sources, document versions, answer mode, model and prompt version, and relevant conversation state. Invalidate or stop using entries after deletion or replacement. Never serve another user's cached answer just because their questions look similar.

Semantic caching can accidentally reuse an answer for a different question. Evaluate correctness and privacy before adding it. Current OCR reuse is implemented; the broader answer-cache design here is a proposed improvement, not an existing feature claim.

### 36. How would you stop overload and cascading failures?

Put limits on uploads and generations, cap worker and model-call concurrency, use bounded queues and timeouts, and reject excess work with useful 429 or 503 responses. Retry transient failures only with a bounded policy and jitter, respecting provider retry guidance; retries can worsen an overload. Use idempotent upload reservations or stable job identities to avoid duplicate storage and duplicate processing when clients retry.

Prioritize interactive questions separately from expensive bulk ingestion when needed. Show processing or partial status honestly. Monitor queue age as well as queue length, because a small number of huge OCR documents can still produce long waits. These are scale-design recommendations; verify which controls already exist before describing them as deployed.

### 37. How would you prove that it scales?

Build a representative workload with catalog reads, authenticated actions, document ingestion, and RAG questions. Start with stubbed provider responses to isolate application limits, then test a controlled end-to-end workload within provider allowances. Stubbed results cannot establish real model-provider capacity. Measure achieved throughput, p50/p95/p99 latency, error rate, queue age, resource use, DB connections, and token usage.

Use a representative corpus and test cross-user isolation and deletion while load runs. Gradually increase load, test bursts and dependency failures, and observe where service targets fail. Define targets such as p95 response time and acceptable error rate before claiming success. One million registered accounts is not evidence of handling one million requests per day or one million simultaneous users.

### A 60-second scaling answer to rehearse

“First I would clarify whether one million means per day, per month, or per second, and what percentage are RAG generations. One million daily requests averages about 12 per second, but I would size for measured peaks and token throughput. I would use stateless API replicas, independently scaled ingestion and embedding workers, shared quotas, bounded database connections, and measured vector-index improvements. I would cache safely, enforce backpressure, and load test latency and correctness. Generation capacity is a separate limit: the present free-only Groq setup cannot be promised at that scale. I would state the supported budget and queue or reject excess work unless the inference-capacity constraint changes.”

## 11. Code map and references

Repository paths are relative to the project root. Use these to check details if the implementation changes:

- `Frontend/src/ai/pages/SubjectDetail.tsx` and `ChapterSelector.tsx` — syllabus selection and study modes.
- `Frontend/src/ai/pages/AIInteractMode.tsx` — tutor and free-discussion interface, transcript and speech controls.
- `backend/src/services/syllabus.service.js` — shared syllabus lookup.
- `backend/src/ai/controllers/ai.controller.js` — syllabus-driven MCQs, flashcards, tutoring, and generated exam questions.
- `backend/src/ai/study/rag.service.js` — retrieval, fusion, bounded context, source handling.
- `backend/src/ai/study/groq-budget.js` — allowed and default Groq models and budget-related configuration.
- `backend/src/ai/study/policy.js` — study limits and policy defaults.
- `backend/study-worker/study_worker/embeddings.py` — E5 embedding and token limits.
- `backend/study-worker/study_worker/` — document extraction, OCR, job processing, and worker configuration.
- `docs/rag-recruiter-demo.md` and `docs/demos/operating-systems/` — recorded demo and evidence.
- `docs/deployment-verification.md` — deployment checks at the time they were performed.

External sources for further reading:

- [Multilingual E5 model card](https://huggingface.co/intfloat/multilingual-e5-small) — model usage and prefixes.
- [pgvector documentation](https://github.com/pgvector/pgvector) — vector operators and indexes.
- [PostgreSQL full-text search](https://www.postgresql.org/docs/current/textsearch-controls.html) — query parsing and ranking.
- [Microsoft Research: GraphRAG](https://www.microsoft.com/en-us/research/publication/from-local-to-global-a-graph-rag-approach-to-query-focused-summarization/) — global, query-focused summarization.
- [Qdrant multitenancy documentation](https://qdrant.tech/documentation/manage-data/multitenancy/) and [Pinecone documentation](https://docs.pinecone.io/) — alternatives to investigate.
- [Groq model documentation](https://console.groq.com/docs/models) — verify current model availability and limits.
- [Tesseract documentation](https://tesseract-ocr.github.io/tessdoc/) — OCR concepts and capabilities.
