import os
import uuid
import logging
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible
from supabase import create_client

logger = logging.getLogger(__name__)


@deconstructible
class SupabaseStorage(Storage):
    """
    Custom Django storage backend for Supabase Storage.
    """

    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        self.bucket_name = os.getenv("SUPABASE_STORAGE_BUCKET", "media")
        logger.info(f"SupabaseStorage init: URL={self.supabase_url}, bucket={self.bucket_name}, key_set={bool(self.supabase_key)}")
        if not self.supabase_url or not self.supabase_key:
            raise ValueError(f"Supabase config missing: URL={bool(self.supabase_url)}, KEY={bool(self.supabase_key)}")
        self.client = create_client(self.supabase_url, self.supabase_key)

    def _get_storage(self):
        return self.client.storage.from_(self.bucket_name)

    def _save(self, name, content):
        # Generate a unique name to avoid collisions
        ext = os.path.splitext(name)[1]
        folder = os.path.dirname(name)
        unique_name = f"{folder}/{uuid.uuid4().hex}{ext}" if folder else f"{uuid.uuid4().hex}{ext}"
        # Normalize path separators
        unique_name = unique_name.replace("\\", "/")

        file_bytes = content.read()

        # Detect content type
        content_type = getattr(content, "content_type", None) or "application/octet-stream"

        self._get_storage().upload(
            path=unique_name,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
        logger.info(f"SupabaseStorage: uploaded {unique_name}")
        return unique_name

    def url(self, name):
        name = name.replace("\\", "/")
        return f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{name}"

    def exists(self, name):
        # Always return False so Django never skips a save
        return False

    def delete(self, name):
        name = name.replace("\\", "/")
        try:
            self._get_storage().remove([name])
        except Exception:
            pass

    def size(self, name):
        # Not trivially available via the Supabase client
        return 0

    def listdir(self, path):
        path = (path or "").replace("\\", "/")
        try:
            response = self._get_storage().list(path)
            dirs = []
            files = []
            for item in response:
                if item.get("id") is None:
                    dirs.append(item["name"])
                else:
                    files.append(item["name"])
            return dirs, files
        except Exception:
            return [], []
