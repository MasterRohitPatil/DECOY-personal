import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.services.csv_parser import ingest_csv_data

client = TestClient(app)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

def test_servicenow_cmdb_ingestion():
    path = os.path.join(DATA_DIR, "sample_cmdb_servicenow.csv")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    db = SessionLocal()
    try:
        res = ingest_csv_data(content, db, actor="Test Runner")
        assert res["status"] == "SUCCESS"
        assert res["schema_type"] == "ASSETS"
        assert res["rows_processed"] == 7
        assert res["rows_imported"] == 6
        assert res["rows_skipped"] == 1
        # Check diagnostic entry for the skipped row
        skipped = [d for d in res["diagnostics"] if d["status"] == "SKIPPED"]
        assert len(skipped) == 1
        assert "Missing required software/product" in skipped[0]["reason"]
    finally:
        db.close()

def test_aws_ec2_inventory_ingestion():
    path = os.path.join(DATA_DIR, "sample_aws_ec2_inventory.csv")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    db = SessionLocal()
    try:
        res = ingest_csv_data(content, db, actor="Test Runner")
        assert res["status"] == "SUCCESS"
        assert res["schema_type"] == "ASSETS"
        assert res["rows_processed"] == 7
        assert res["rows_imported"] == 6
        assert res["rows_skipped"] == 1
        skipped = [d for d in res["diagnostics"] if d["status"] == "SKIPPED"]
        assert len(skipped) == 1
        assert "Missing required hostname" in skipped[0]["reason"]
    finally:
        db.close()

def test_qualys_threat_feed_ingestion():
    path = os.path.join(DATA_DIR, "sample_qualys_threat_feed.csv")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    db = SessionLocal()
    try:
        res = ingest_csv_data(content, db, actor="Test Runner")
        assert res["status"] == "SUCCESS"
        assert res["schema_type"] == "THREATS"
        assert res["rows_processed"] == 6
        assert res["rows_imported"] == 5
        assert res["rows_skipped"] == 1
        skipped = [d for d in res["diagnostics"] if d["status"] == "SKIPPED"]
        assert len(skipped) == 1
        assert "Missing affected software/product" in skipped[0]["reason"]
        assert res["warnings_generated"] >= 0
    finally:
        db.close()

def test_unknown_csv_schema_rejection():
    bad_csv = "fruit,color,weight\napple,red,150\nbanana,yellow,120"
    db = SessionLocal()
    try:
        res = ingest_csv_data(bad_csv, db, actor="Test Runner")
        assert res["status"] == "ERROR"
        assert "Unrecognized CSV format" in res["message"]
    finally:
        db.close()

def test_sample_csv_api_endpoints():
    res_cmdb = client.get("/api/sample-csv/servicenow")
    assert res_cmdb.status_code == 200
    assert "device_name" in res_cmdb.text

    res_aws = client.get("/api/sample-csv/aws")
    assert res_aws.status_code == 200
    assert "node" in res_aws.text

    res_qualys = client.get("/api/sample-csv/qualys")
    assert res_qualys.status_code == 200
    assert "cve_number" in res_qualys.text
