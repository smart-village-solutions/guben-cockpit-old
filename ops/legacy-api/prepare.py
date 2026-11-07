#!/usr/bin/env python3
"""Remove the retired TMB importer from the exact production API source revision."""
import hashlib
from pathlib import Path
import shutil
import sys

SOURCE_REVISION = "0329f2a8a792247e433fc405f9fc28deb7726587"
STARTUP_SHA256 = "c07141a400390afd9ff56838c02281b38aabcc50ae2387db80a87c223553173c"


def prepare(root: Path) -> None:
    startup = root / "Api/Startup.cs"
    if hashlib.sha256(startup.read_bytes()).hexdigest() != STARTUP_SHA256:
        raise SystemExit("Unexpected legacy API source; refusing to patch")
    source = startup.read_text()
    before = source.index("    //Starting the EventImporter")
    after = source.index("    RecurringJob.AddOrUpdate<ProjectImporter>", before)
    source = source[:before] + source[after:]
    source = source.replace("using Jobs.EventImporter;\n", "")
    source = source.replace("    // BackgroundJob.Enqueue<EventImporter>(importer => importer.Import());\n", "")
    if "EventImporter" in source:
        raise SystemExit("Unexpected EventImporter reference remains")
    startup.write_text(source)
    shutil.rmtree(root / "Jobs/EventImporter")
    for path in root.rglob("*.cs"):
        if "EventImporter" in path.read_text(encoding="utf-8-sig"):
            raise SystemExit("Unexpected importer reference in " + str(path.relative_to(root)))
    if 'RecurringJob.AddOrUpdate<ProjectImporter>("ProjectImporter"' not in source:
        raise SystemExit("Project importer registration was unexpectedly changed")
    print("Removed EventImporter registration and all seven importer source files")


if __name__ == "__main__":
    prepare(Path(sys.argv[1]))
