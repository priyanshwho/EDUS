# Host deployment on oracler

The host uses systemd **user** services under `priyanshu`, with lingering enabled so
they survive logout and start at boot. Express remains the existing system service
`edus-backend.service`. No public port is added: query embeddings bind `127.0.0.1:8091`.

## Persistent paths

- Source: `/home/priyanshu/EDUS/backend/study-worker`.
- Python 3.12 environment: `/home/priyanshu/.local/share/edus-study/venv`.
- Pinned E5 cache: `/home/priyanshu/.cache/edus-study/huggingface`.
- User-local printed OCR runtime: `/home/priyanshu/.local/share/edus-study/tesseract`.
- Units: `/home/priyanshu/.config/systemd/user/edus-study-{embeddings,worker}.service`.
- Secrets: existing `backend/.env`, mode 0600. A private predeployment backup is kept
  outside Git under `/home/priyanshu/.local/share/edus-study/backups/`.

The installed Python environment and model cache are on persistent disk, not `/tmp`.
Both model processes use offline mode after the pinned weights have been cached.
Each service is limited to 2 GiB memory and 150% CPU, with conservative numerical-library
thread counts. Measure actual load before increasing these values.

This host sets `STUDY_VISION_MAX_OUTPUT=512`, and vision requests use instruct mode
(`reasoning_effort=none`). Live testing found that the larger output budget was rejected
with provider token-limit 429s, while the bounded request succeeded. Dense/long handwritten
pages can be partial at this output cap; review the source and retry within free quotas.
The library permits up to 3500 output tokens, but an account's actual allowance must be
tested before increasing this host setting. No paid model fallback is enabled.

The worker unit's portable Tesseract paths are specific to this **Linux arm64 host**.
For another machine, install Tesseract/English language data through its package manager
and adjust/remove the PATH, LD_LIBRARY_PATH, and TESSDATA_PREFIX overrides accordingly.
Never copy architecture-specific binaries blindly to another host.

## Reprovisioning

Use Python 3.12, the requirements file, and CPU-only PyTorch. Populate the pinned model
cache before enabling offline mode. Configure the existing database/storage credentials,
a strong shared internal token, and actual Free-plan confirmation. Then:

```sh
cd /home/priyanshu/EDUS/backend
npm run migrate:study
mkdir -p /home/priyanshu/.config/systemd/user
cp study-worker/deploy/edus-study-*.service /home/priyanshu/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now edus-study-embeddings.service edus-study-worker.service
sudo /usr/bin/systemctl restart edus-backend.service
npm run study:check
```

An administrator must enable lingering if it is not already enabled. Installing these
units alone does not install Python packages, OCR binaries, model weights, or secrets.

## Nginx boundary

The original API site has no explicit upload ceiling, so Nginx's default blocks files
well below the application's 20 MiB limit. From a root/admin shell, review and run:

```sh
python3 /home/priyanshu/EDUS/backend/study-worker/deploy/configure-nginx.py
```

The script only targets `api.edusphere.live`, saves a backup, sets a 21 MiB request
ceiling (multipart overhead included) and 300-second upstream timeouts, validates the
configuration, and reloads Nginx. Existing custom bounds cause it to stop for review.
The deployment account cannot perform this root step under its current sudo policy.
The application still enforces its smaller per-kind byte/page limits independently.

## Normal updates and checks

The backend CI deployment detects both enabled user services, applies additive study
migrations, restarts them with the API, and requires study readiness before succeeding.
If Python dependencies change, update the persistent environment deliberately before
restarting; CI does not silently replace Python packages. Unit-file changes require
copying the reviewed units again and `systemctl --user daemon-reload`.

```sh
systemctl --user status edus-study-embeddings.service edus-study-worker.service
journalctl --user -u edus-study-embeddings -u edus-study-worker --since '15 min ago'
cd /home/priyanshu/EDUS/backend
npm run study:check
```

Readiness verifies selected schema/configuration checks and embedding identity; a live
ingestion/query test is still needed to establish end-to-end behavior. Never publish
raw secret files, full private prompts, signed source URLs, or customer documents in logs.

To disable private processing while investigating an outage, stop both user services.
Keep the additive schema and private files for recovery; do not drop tables while
durable deletion jobs still need them. Restoring the predeployment environment file
also restores previous configuration, but does not undo schema changes or object writes.
