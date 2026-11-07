#!/usr/bin/env python3
"""Remove both retired importers from the exact production API source revision."""
import hashlib
import json
from pathlib import Path
import sys

SOURCE_REVISION = "0329f2a8a792247e433fc405f9fc28deb7726587"
STARTUP_SHA256 = "c07141a400390afd9ff56838c02281b38aabcc50ae2387db80a87c223553173c"


def prepare(root: Path) -> None:
    startup = root / "Api/Startup.cs"
    if hashlib.sha256(startup.read_bytes()).hexdigest() != STARTUP_SHA256:
        raise SystemExit("Unexpected legacy API source; refusing to patch")
    source = startup.read_text()
    before = source.index("  private void AddJobs()")
    after = source.index("  /// <summary>", before)
    source = source[:before] + source[after:]
    source = source.replace("using Jobs.EventImporter;\n", "")
    source = source.replace("using Jobs.ProjectImporter;\n", "")
    source = source.replace("    AddJobs();\n\n", "")
    if any(name in source for name in ("EventImporter", "ProjectImporter", "AddJobs")):
        raise SystemExit("Unexpected importer registration remains")
    startup.write_text(source)
    # Both jobs are retired; their translation, HTTP, and transaction helpers
    # have no consumers outside Jobs. Keep the project file/dependency graph so
    # only the two application assemblies need replacing in the deployed image.
    jobs = root / "Jobs"
    expected = {
        "Configuration/ConfigurationExtensions.cs",
        "EventImporter/CategoryImporter.cs",
        "EventImporter/CategoryMapping.cs",
        "EventImporter/CustomDateTimeConverter.cs",
        "EventImporter/EventImporter.cs",
        "EventImporter/LocationImporter.cs",
        "EventImporter/XmlEvent.cs",
        "EventImporter/XmlExtensions.cs",
        "HttpClient/HttpClientExtensions.cs",
        "ImporterTransactions.cs",
        "LibreTranslator.cs",
        "ProjectImporter/ProjectImporter.cs",
    }
    actual = {p.relative_to(jobs).as_posix() for p in jobs.rglob("*.cs")}
    if actual != expected:
        raise SystemExit("Unexpected legacy Jobs source files; refusing to delete")
    for relative in expected:
        (jobs / relative).unlink()
    for directory in ("Configuration", "EventImporter", "HttpClient", "ProjectImporter"):
        (jobs / directory).rmdir()
    for path in root.rglob("*.cs"):
        if any(name in path.read_text(encoding="utf-8-sig") for name in ("EventImporter", "ProjectImporter", "LibreTranslator", "ImporterTransactions")):
            raise SystemExit("Unexpected importer reference in " + str(path.relative_to(root)))
    settings = root / "Api/appsettings.json"
    config = json.loads(settings.read_text(encoding="utf-8-sig"))
    if set(config.get("Jobs", {})) != {"ProjectImporter", "LibreTranslate"}:
        raise SystemExit("Unexpected legacy Jobs configuration")
    del config["Jobs"]
    settings.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
    print("Removed both job registrations, twelve importer/helper source files, and obsolete Jobs configuration")


if __name__ == "__main__":
    prepare(Path(sys.argv[1]))
