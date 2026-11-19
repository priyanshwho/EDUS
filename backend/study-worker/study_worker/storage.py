"""Private Tigris/S3 objects. No public ACLs or filenames in derived keys."""
import hashlib
from .core import MAX_FILE_BYTES, MAX_IMAGE_BYTES, ExtractionError, derived_prefix


class Storage:
    def __init__(self, settings, client=None):
        self.bucket = settings.bucket
        if client is None:
            import boto3
            from botocore.config import Config
            client = boto3.client("s3", region_name=settings.region, endpoint_url=settings.endpoint or None,
                                  config=Config(connect_timeout=5, read_timeout=15,
                                                s3={"addressing_style": "path"},
                                                request_checksum_calculation="when_required",
                                                response_checksum_validation="when_required",
                                                retries={"max_attempts": 2, "mode": "standard"}))
        self.client = client

    def download(self, key, path, expected_sha=None):
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        body = response["Body"]
        size, digest = 0, hashlib.sha256()
        try:
            if response.get("ContentLength", 0) > MAX_FILE_BYTES:
                raise ExtractionError("PDF exceeds the 20 MiB limit")
            with open(path, "wb") as file:
                while True:
                    data = body.read(65536)
                    if not data:
                        break
                    size += len(data)
                    if size > MAX_FILE_BYTES:
                        raise ExtractionError("PDF exceeds the 20 MiB limit")
                    digest.update(data)
                    file.write(data)
            with open(path, "rb") as file:
                if b"%PDF-" not in file.read(1024):
                    raise ExtractionError("Object is not a PDF")
            if expected_sha and digest.hexdigest() != str(expected_sha).lower():
                raise ExtractionError("Uploaded PDF checksum does not match")
        finally:
            body.close()

    def put_page(self, job, page):
        if len(page.image) > MAX_IMAGE_BYTES:
            raise ExtractionError("Rendered page exceeds image size limit")
        key = (derived_prefix(job["workspace_id"], job["document_id"]) +
               str(job["lease_token"]) + f"/page-{page.number:04d}.jpg")
        self.client.put_object(Bucket=self.bucket, Key=key, Body=page.image,
                               ContentType="image/jpeg", CacheControl="private, no-store")
        return key

    def delete_keys(self, keys):
        keys = list(keys)
        for start in range(0, len(keys), 1000):
            response = self.client.delete_objects(Bucket=self.bucket,
                Delete={"Objects": [{"Key": k} for k in keys[start:start + 1000]], "Quiet": True})
            if response.get("Errors"):
                raise RuntimeError("Private object deletion needs retry")

    def delete_document(self, job, check):
        # Exact validated UUID prefix; list pagination must never widen its scope.
        prefix = derived_prefix(job["workspace_id"], job["document_id"])
        check()
        self.delete_keys([job["s3_key"]])
        paginator = self.client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=self.bucket, Prefix=prefix):
            check()
            self.delete_keys(obj["Key"] for obj in page.get("Contents", []))

    def delete_attempt(self, job):
        import uuid
        prefix = derived_prefix(job["workspace_id"], job["document_id"]) + str(uuid.UUID(str(job["lease_token"]))) + "/"
        paginator = self.client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=self.bucket, Prefix=prefix):
            self.delete_keys(obj["Key"] for obj in page.get("Contents", []))

