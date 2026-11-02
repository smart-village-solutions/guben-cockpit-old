import datetime
import gzip
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock


spec = importlib.util.spec_from_file_location(
    "archive_retention",
    Path(__file__).resolve().parents[1] / "guben-cockpit-log-archive-retention.py",
)
retention = importlib.util.module_from_spec(spec)
spec.loader.exec_module(retention)


class ArchiveRetentionTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "api.jsonl.gz"
        self.now = datetime.datetime(2026, 11, 2, 12, tzinfo=datetime.timezone.utc)
        self.cutoff = self.now - datetime.timedelta(days=14)

    def record(self, timestamp):
        return (json.dumps({"log": "fixture", "time": timestamp}) + "\n").encode()

    def archive(self, content, captured=None):
        with gzip.open(self.path, "wb") as output:
            output.write(content)
        self.path.with_suffix(".metadata.json").write_text(
            json.dumps({"capturedAt": (captured or self.now).isoformat()})
        )

    def read(self):
        with gzip.open(self.path, "rb") as source:
            return source.read()

    def test_retains_cutoff_and_newer_entries_and_recent_undated_records(self):
        old = self.record("2026-10-19T11:59:59.999999Z")
        boundary = self.record("2026-10-19T12:00:00Z")
        newer = self.record("2026-11-01T00:00:00Z")
        undated = b"malformed historical record\n"
        self.archive(old + boundary + newer + undated)
        self.assertEqual(retention.prune(self.path, self.cutoff), 1)
        self.assertEqual(self.read(), boundary + newer + undated)

    def test_removes_empty_archive_and_its_metadata(self):
        self.archive(self.record("2026-10-01T00:00:00Z"))
        retention.prune(self.path, self.cutoff)
        self.assertFalse(self.path.exists())
        self.assertFalse(self.path.with_suffix(".metadata.json").exists())

    def test_undated_records_expire_from_capture_time(self):
        self.archive(b"undated\n", self.cutoff - datetime.timedelta(seconds=1))
        retention.prune(self.path, self.cutoff)
        self.assertFalse(self.path.exists())

    def test_valid_newer_entry_survives_an_old_capture_timestamp(self):
        content = self.record("2026-11-01T00:00:00Z")
        self.archive(content, self.cutoff - datetime.timedelta(days=1))
        self.assertEqual(retention.prune(self.path, self.cutoff), 0)
        self.assertEqual(self.read(), content)

    def test_compares_timezone_offsets_as_instants(self):
        old = self.record("2026-10-19T13:59:59+02:00")
        boundary = self.record("2026-10-19T14:00:00+02:00")
        self.archive(old + boundary)
        retention.prune(self.path, self.cutoff)
        self.assertEqual(self.read(), boundary)

    def test_failed_replacement_preserves_original_and_removes_temporary_file(self):
        content = self.record("2026-10-01T00:00:00Z") + self.record("2026-11-01T00:00:00Z")
        self.archive(content)
        original = self.path.read_bytes()
        with mock.patch.object(retention.os, "replace", side_effect=OSError("fixture failure")):
            with self.assertRaises(OSError):
                retention.prune(self.path, self.cutoff)
        self.assertEqual(self.path.read_bytes(), original)
        self.assertTrue(self.path.with_suffix(".metadata.json").exists())
        self.assertFalse(self.path.with_name(self.path.name + ".tmp").exists())


if __name__ == "__main__":
    unittest.main()
