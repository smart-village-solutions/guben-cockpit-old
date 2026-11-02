#!/usr/bin/python3
"""Expire only the protected Cockpit logs archived during the driver migration."""
import datetime
import fcntl
import gzip
import json
import os
from pathlib import Path

ROOT = Path('/var/lib/guben-cockpit-log-retention/archive')

def prune(path, cutoff):
    metadata = json.loads(path.with_suffix('.metadata.json').read_text())
    captured = datetime.datetime.fromisoformat(metadata['capturedAt'].replace('Z', '+00:00'))
    initial = path.stat()
    temporary = path.with_name(path.name + '.tmp')
    removed = 0
    kept = 0
    try:
        fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'wb') as raw, gzip.GzipFile(fileobj=raw, mode='wb', mtime=0) as target:
            with gzip.open(path, 'rb') as source:
                for line in source:
                    stamp = captured
                    try:
                        value = json.loads(line)['time']
                        parsed = datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))
                        if parsed.tzinfo is not None:
                            stamp = parsed
                    except (ValueError, TypeError, KeyError, UnicodeDecodeError, AttributeError):
                        pass
                    if stamp < cutoff:
                        removed += 1
                    else:
                        target.write(line)
                        kept += 1
        with open(temporary, 'rb') as check:
            os.fsync(check.fileno())
        current = path.stat()
        if (initial.st_ino, initial.st_size, initial.st_mtime_ns) != (current.st_ino, current.st_size, current.st_mtime_ns):
            raise RuntimeError('Archive changed during retention check')
        if removed:
            if kept:
                os.replace(temporary, path)
            else:
                path.unlink()
                path.with_suffix('.metadata.json').unlink()
        return removed
    finally:
        temporary.unlink(missing_ok=True)

def main():
    ROOT.mkdir(parents=True, exist_ok=True, mode=0o700)
    with open(ROOT / '.retention.lock', 'a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return
        cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=14)
        paths = list(ROOT.glob('*.jsonl.gz'))
        removed = sum(prune(path, cutoff) for path in paths)
        print(json.dumps({'archivesChecked': len(paths), 'expiredRecordsRemoved': removed}))

if __name__ == '__main__':
    main()
