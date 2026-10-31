"""Upgrade an existing (e.g. Supabase) database so it matches the current code.

Run from the backend folder:   python -m scripts.migrate_existing
Safe to run repeatedly. It only ADDS missing tables/columns, never deletes data.
(The API also runs this automatically on startup.)
"""
from app import models  # noqa: F401  (registers every table)
from app.db.schema_sync import sync_schema


def run():
    added = sync_schema(verbose=True)
    print("Database upgrade complete." if added else "Database was already up to date.")


if __name__ == "__main__":
    run()
