import os
import json
from typing import Optional, Any

# Simple cache helper: uses Redis if available, falls back to in-memory dict
class CacheClient:
    def __init__(self):
        self.client = None
        self._memory = {}
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        try:
            import redis
            self.client = redis.from_url(redis_url, decode_responses=True)
            self.client.ping()
        except Exception:
            self.client = None

    def get(self, key: str) -> Optional[Any]:
        if self.client:
            try:
                val = self.client.get(key)
                return json.loads(val) if val else None
            except Exception:
                pass
        return self._memory.get(key)

    def set(self, key: str, value: Any, expire_seconds: int = 300):
        if self.client:
            try:
                self.client.setex(key, expire_seconds, json.dumps(value))
                return
            except Exception:
                pass
        self._memory[key] = value

    def delete(self, key: str):
        if self.client:
            try:
                self.client.delete(key)
            except Exception:
                pass
        self._memory.pop(key, None)

redis_client = CacheClient()
