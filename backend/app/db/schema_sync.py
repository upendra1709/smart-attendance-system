"""Bring an existing database up to date with the SQLAlchemy models.

``Base.metadata.create_all`` only creates *missing tables*; it never adds a column to a table that
already exists. That is why an older Supabase database fails with "column ... does not exist".
``sync_schema`` adds every missing column (and the roll-number unique index) and is safe to run
any number of times. It never drops or alters existing data.
"""
from sqlalchemy import inspect, text
from sqlalchemy.sql.elements import TextClause
from sqlalchemy.sql.functions import FunctionElement

from app.db.database import Base, engine


def _literal(value) -> str | None:
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        return "'" + value.replace("'", "''") + "'"
    return None


def _default_sql(column) -> str | None:
    """A DEFAULT clause for the new column, or None when there is no simple one."""
    server_default = column.server_default
    if server_default is not None:
        arg = getattr(server_default, "arg", None)
        if isinstance(arg, TextClause):
            return arg.text
        if isinstance(arg, FunctionElement):
            return "CURRENT_TIMESTAMP"  # func.now()
        return _literal(arg)
    if column.default is not None and getattr(column.default, "is_scalar", False):
        return _literal(column.default.arg)
    return None


def sync_schema(verbose: bool = False) -> list[str]:
    """Create missing tables, then add missing columns. Returns what was added."""
    Base.metadata.create_all(bind=engine)
    added: list[str] = []

    # 1. Read the current layout FIRST, before any ALTER runs.
    #    (Reading the catalog for a table from a second connection while an uncommitted
    #    ALTER TABLE on it is open waits forever on PostgreSQL and ends in a statement timeout.)
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    present_columns = {
        table.name: {column["name"] for column in inspector.get_columns(table.name)}
        for table in Base.metadata.sorted_tables
        if table.name in existing_tables
    }
    engine.dispose()  # release the reader connections before changing anything

    # 2. Apply every change on a single connection.
    with engine.begin() as connection:
        if engine.dialect.name == "postgresql":
            # fail fast with a clear message instead of hanging if another session holds a lock
            connection.execute(text("SET LOCAL lock_timeout = '15s'"))
        for table in Base.metadata.sorted_tables:
            if table.name not in present_columns:
                continue  # create_all just made it with the full, current layout
            for column in table.columns:
                if column.name in present_columns[table.name]:
                    continue
                sql_type = column.type.compile(dialect=engine.dialect)
                default = _default_sql(column)
                if engine.dialect.name == "sqlite" and default == "CURRENT_TIMESTAMP":
                    default = None  # SQLite cannot add a column with a non-constant default
                clause = f'"{column.name}" {sql_type}'
                if default is not None:
                    clause += f" DEFAULT {default}"
                    if not column.nullable:
                        clause += " NOT NULL"  # existing rows get the default
                # a NOT NULL column with no default is added as nullable: existing rows have no value for it
                connection.execute(text(f'ALTER TABLE "{table.name}" ADD COLUMN {clause}'))
                added.append(f"{table.name}.{column.name}")
                if verbose:
                    print(f"Added {table.name}.{column.name}")

        users_columns = present_columns.get("users", set()) | {a.split(".")[1] for a in added if a.startswith("users.")}
        if "roll_number" in users_columns and not _roll_number_is_unique(connection):
            connection.execute(text("CREATE UNIQUE INDEX ix_users_roll_number ON users (roll_number)"))
            added.append("index users.roll_number")
            if verbose:
                print("Added unique index on users.roll_number")
    return added


def _roll_number_is_unique(connection) -> bool:
    """True when users.roll_number already has a unique index/constraint (a fresh table does)."""
    if connection.dialect.name == "postgresql":
        rows = connection.execute(text(
            "SELECT 1 FROM pg_indexes WHERE tablename = 'users' "
            "AND indexdef ILIKE 'CREATE UNIQUE%(roll_number)%' LIMIT 1"
        ))
    else:
        rows = connection.execute(text(
            "SELECT 1 FROM sqlite_master WHERE type = 'index' AND tbl_name = 'users' "
            "AND sql LIKE '%UNIQUE%roll_number%' LIMIT 1"
        ))
    return rows.first() is not None
