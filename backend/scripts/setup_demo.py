"""Prepare the database for a live demo.

    python -m scripts.setup_demo                 # add the 4 classes + enroll all demo students (keeps all data)
    python -m scripts.setup_demo --fresh         # ALSO wipe sessions, attendance and face enrollments
    python -m scripts.setup_demo --fresh --yes   # same, without the confirmation question

Safe to run repeatedly. Without --fresh nothing is ever deleted.
"""
import argparse

from app import models  # noqa: F401  (registers every table)
from app.db.database import SessionLocal
from app.db.demo_data import DEMO_SUBJECTS, ensure_demo_classes, reset_attendance, reset_faces
from app.db.schema_sync import sync_schema


def run() -> None:
    parser = argparse.ArgumentParser(description="Set up demo classes for SmartAttend")
    parser.add_argument("--fresh", action="store_true", help="also delete all sessions, attendance records and face enrollments")
    parser.add_argument("--yes", action="store_true", help="do not ask for confirmation")
    args = parser.parse_args()

    sync_schema()
    db = SessionLocal()
    try:
        if args.fresh:
            if not args.yes:
                answer = input(
                    "This DELETES all sessions, attendance records, regularisation requests and face enrollments.\n"
                    "Users, subjects, classes and enrollments are kept. Type 'yes' to continue: "
                )
                if answer.strip().lower() != "yes":
                    print("Cancelled. Nothing was changed.")
                    return
            print("Cleared:", reset_attendance(db), reset_faces(db))

        result = ensure_demo_classes(db)
        print(
            f"Done. {result['classes']} classes ready for {result['students']} students "
            f"({result['created_classes']} new class(es), {result['new_enrollments']} new enrollment(s))."
        )
        for code, name, schedule, room in DEMO_SUBJECTS:
            print(f"  {code}  {name}  |  {schedule}  |  {room}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
