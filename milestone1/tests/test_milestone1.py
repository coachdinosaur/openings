import hashlib
import json
import os
import struct
import unittest
from pathlib import Path


WORKSPACE = Path(__file__).resolve().parents[2]
MILESTONE = WORKSPACE / "milestone1"
FIXTURE_PATH = MILESTONE / "fixture" / "catalan-ch1-b2.fixture.json"
ASSET_MANIFEST_PATH = MILESTONE / "provenance" / "asset-manifest.json"
SOURCE_MANIFEST_PATH = MILESTONE / "provenance" / "source-manifest.json"

ALLOWED_STATUSES = {
    "source-verified",
    "deterministically derived",
    "proposed",
    "unresolved",
}
FORBIDDEN_DIAGRAM_FIELDS = {
    "fen",
    "accepted_fen",
    "recognition_tier",
    "recognition_confidence",
    "piece_placement",
    "pieces",
}
INCIDENTAL_HASH_FIELDS = {
    "timestamp",
    "generated_at",
    "generated_id",
    "absolute_path",
    "machine_name",
    "user_name",
    "temporary_path",
    "import_run_id",
}


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest().upper()


def canonical_value(value):
    if isinstance(value, dict):
        return {
            key: canonical_value(item)
            for key, item in sorted(value.items())
            if key not in INCIDENTAL_HASH_FIELDS
        }
    if isinstance(value, list):
        return [canonical_value(item) for item in value]
    return value


def canonical_digest(value):
    payload = json.dumps(
        canonical_value(value),
        ensure_ascii=True,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return sha256_bytes(payload)


def walk_statuses(value):
    statuses = []
    if isinstance(value, dict):
        for key, item in value.items():
            if key in {"status", "association_status"}:
                statuses.append(item)
            statuses.extend(walk_statuses(item))
    elif isinstance(value, list):
        for item in value:
            statuses.extend(walk_statuses(item))
    return statuses


def walk_keys(value):
    keys = set()
    if isinstance(value, dict):
        keys.update(value)
        for item in value.values():
            keys.update(walk_keys(item))
    elif isinstance(value, list):
        for item in value:
            keys.update(walk_keys(item))
    return keys


def png_dimensions(data):
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise AssertionError("File is not a PNG")
    return struct.unpack(">II", data[16:24])


class MilestoneOneTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixture = load_json(FIXTURE_PATH)
        cls.asset_manifest = load_json(ASSET_MANIFEST_PATH)
        cls.source_manifest = load_json(SOURCE_MANIFEST_PATH)

    def test_fixture_schema(self):
        self.assertEqual(
            set(self.fixture),
            {
                "schema_version",
                "fixture_id",
                "status",
                "source",
                "boundaries",
                "reading_regions",
                "source_context",
                "derived_position",
                "diagrams",
                "evidence_regions",
            },
        )
        self.assertEqual(self.fixture["schema_version"], 1)
        self.assertEqual(self.fixture["fixture_id"], "catalan.chapter1.b2.prototype")
        self.assertEqual(len(self.fixture["reading_regions"]), 3)
        self.assertEqual(len(self.fixture["diagrams"]), 3)

    def test_only_exact_status_values_are_used(self):
        statuses = walk_statuses(self.fixture)
        self.assertTrue(statuses)
        self.assertTrue(set(statuses).issubset(ALLOWED_STATUSES))
        self.assertEqual(set(statuses), ALLOWED_STATUSES)

    def test_source_document_identity(self):
        source = self.fixture["source"]
        pdf = WORKSPACE / source["filename"]
        data = pdf.read_bytes()
        self.assertEqual(len(data), source["bytes"])
        self.assertEqual(sha256_bytes(data), source["sha256"])
        self.assertEqual(source, self.source_manifest["source"])

    def test_evidence_references_resolve(self):
        evidence_ids = {
            item["region_id"] for item in self.fixture["evidence_regions"]
        }
        context_refs = set(self.fixture["source_context"]["source_evidence_region_ids"])
        derived_refs = set(self.fixture["derived_position"]["source_evidence_region_ids"])
        boundary_refs = {
            self.fixture["boundaries"]["start"]["evidence_region_id"],
            self.fixture["boundaries"]["end"]["evidence_region_id"],
        }
        self.assertTrue(context_refs.issubset(evidence_ids))
        self.assertTrue(derived_refs.issubset(evidence_ids))
        self.assertTrue(boundary_refs.issubset(evidence_ids))

    def test_derived_fen_status_and_source_links(self):
        derived = self.fixture["derived_position"]
        self.assertEqual(derived["status"], "deterministically derived")
        self.assertEqual(
            derived["fen"],
            "r1bq1rk1/pp1n1ppp/2p1pn2/3p4/1bPP4/2N3P1/PP1NPPBP/R1BQ1RK1 w - - 8 9",
        )
        self.assertEqual(len(derived["source_evidence_region_ids"]), 4)
        self.assertEqual(derived["validation"]["result"], "legal")

    def test_diagrams_have_no_recognition_or_position_fields(self):
        for diagram in self.fixture["diagrams"]:
            self.assertEqual(diagram["association_status"], "source-verified")
            self.assertEqual(diagram["expected_role"]["status"], "proposed")
            self.assertEqual(diagram["board_identity"]["status"], "unresolved")
            self.assertTrue(diagram["association_evidence"])
            self.assertFalse(walk_keys(diagram) & FORBIDDEN_DIAGRAM_FIELDS)

    def test_manifest_schemas(self):
        self.assertEqual(
            set(self.asset_manifest),
            {
                "schema_version",
                "source_repository",
                "source_commit",
                "canonicalization",
                "groups",
                "entries",
            },
        )
        self.assertEqual(
            set(self.source_manifest),
            {
                "schema_version",
                "source",
                "rendering",
                "canonicalization",
                "inventory",
            },
        )
        self.assertEqual(len(self.asset_manifest["entries"]), 18)
        self.assertEqual(len(self.source_manifest["inventory"]), 15)

    def test_copied_asset_hashes_and_optional_source_bytes(self):
        source_root_value = os.environ.get("SOURCE_ASSET_REPO")
        source_root = Path(source_root_value) if source_root_value else None
        for entry in self.asset_manifest["entries"]:
            destination = WORKSPACE / entry["destination_relative_path"]
            data = destination.read_bytes()
            self.assertEqual(len(data), entry["bytes"])
            self.assertEqual(sha256_bytes(data), entry["sha256"])
            if source_root is not None:
                source = source_root / entry["source_relative_path"]
                self.assertEqual(source.read_bytes(), data)

    def test_asset_group_manifest_hashes(self):
        entries_by_path = {
            item["source_relative_path"]: item
            for item in self.asset_manifest["entries"]
        }
        for group in self.asset_manifest["groups"]:
            canonical_entries = []
            for source_path in group["source_paths_in_hash_order"]:
                entry = entries_by_path[source_path]
                self.assertEqual(entry["group"], group["group"])
                canonical_entries.append(
                    {
                        "path": source_path,
                        "bytes": entry["bytes"],
                        "sha256": entry["sha256"].lower(),
                    }
                )
            self.assertEqual(len(canonical_entries), group["file_count"])
            digest = hashlib.sha256(
                json.dumps(
                    canonical_entries,
                    ensure_ascii=True,
                    sort_keys=True,
                    separators=(",", ":"),
                ).encode("utf-8")
            ).hexdigest()
            self.assertEqual(digest, group["canonical_manifest_sha256"])

    def test_render_and_crop_inventory(self):
        for entry in self.source_manifest["inventory"]:
            path = WORKSPACE / entry["relative_path"]
            data = path.read_bytes()
            self.assertTrue(data)
            self.assertEqual(len(data), entry["bytes"])
            self.assertEqual(sha256_bytes(data), entry["sha256"])
            self.assertEqual(
                png_dimensions(data),
                (entry["pixel_width"], entry["pixel_height"]),
            )

    def test_source_inventory_canonical_hash(self):
        inventory = self.source_manifest["inventory"]
        digest = hashlib.sha256(
            json.dumps(
                inventory,
                ensure_ascii=True,
                sort_keys=True,
                separators=(",", ":"),
            ).encode("utf-8")
        ).hexdigest().upper()
        self.assertEqual(
            digest,
            self.source_manifest["canonicalization"]["inventory_sha256"],
        )

    def test_canonical_hash_ignores_incidental_metadata_and_key_order(self):
        first = {
            "value": {"b": 2, "a": 1},
            "timestamp": "one",
            "absolute_path": "one",
            "generated_id": "one",
        }
        second = {
            "generated_id": "two",
            "value": {"a": 1, "b": 2},
            "absolute_path": "two",
            "timestamp": "two",
        }
        self.assertEqual(canonical_digest(first), canonical_digest(second))

    def test_no_local_source_checkout_or_runtime_dependency(self):
        forbidden_name = "chess" + "_pieces"
        forbidden_path = "\\".join(
            ["c:", "users", "ronaldo", "documents", "dev", forbidden_name]
        )
        text_suffixes = {".md", ".json", ".py", ".svg", ".txt"}
        for path in MILESTONE.rglob("*"):
            if path.is_file() and path.suffix.lower() in text_suffixes:
                text = path.read_text(encoding="utf-8", errors="ignore").lower()
                self.assertNotIn(forbidden_name, text)
                self.assertNotIn(forbidden_path, text)

        executable_suffixes = {".js", ".jsx", ".ts", ".tsx", ".py"}
        executable_files = [
            path.relative_to(MILESTONE).as_posix()
            for path in MILESTONE.rglob("*")
            if path.is_file() and path.suffix.lower() in executable_suffixes
        ]
        self.assertEqual(executable_files, ["tests/test_milestone1.py"])


if __name__ == "__main__":
    unittest.main()
