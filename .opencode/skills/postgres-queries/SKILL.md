---
name: postgres-queries
description: Use when querying the Luxide PostgreSQL database. Provides schema reference, MCP tool usage, and example queries for the renders, users, and checkpoints tables. Use ONLY for read-only database inspection and analysis — all queries run in restricted mode via crystaldba/postgres-mcp.
---

# PostgreSQL Database Queries

This skill covers read-only inspection of the Luxide PostgreSQL database via the `postgres` MCP server (crystaldba/postgres-mcp in restricted mode). All SQL is read-only — INSERT, UPDATE, DELETE, DROP, and transaction control statements are rejected at the server level.

## MCP Tools Available

| Tool | Purpose |
|------|---------|
| `postgres_list_schemas` | List all database schemas |
| `postgres_list_objects` | List tables/views/sequences in a schema. Takes `schema_name` (default "public") and optional `object_type` ("table", "view", "sequence", "extension") |
| `postgres_get_object_details` | Column types, constraints, and indexes for a table or view. Takes `schema_name` and `object_name` |
| `postgres_execute_sql` | Execute a **read-only** SQL query. Takes `sql` (string). Inserts/updates/deletes are rejected |
| `postgres_explain_query` | Show the query execution plan. Takes `sql` and optional `analyze` (boolean, runs the query for real stats) and `hypothetical_indexes` (array of `{table, columns}`) |
| `postgres_get_top_queries` | Slowest/most resource-intensive queries from pg_stat_statements. Takes `sort_by` ("total_time", "mean_time", "resources") and `limit` |
| `postgres_analyze_workload_indexes` | Analyze frequently executed queries and recommend indexes |
| `postgres_analyze_query_indexes` | Analyze a list of up to 10 SQL queries and recommend indexes. Takes `queries` (array of strings) |
| `postgres_analyze_db_health` | Run health checks: index, connection, vacuum, sequence, replication, buffer, constraint. Takes optional `health_type` (default "all") |

## Database Schema

### Table: `users`
Luxide users (authenticated via GitHub OAuth).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `integer` | Primary key |
| `github_id` | `integer` | GitHub user ID (unique, indexed) |
| `username` | `text` | GitHub username |
| `avatar_url` | `text` | GitHub avatar URL |
| `role` | `text` | `"admin"` or `"user"` (admins have unlimited resource quotas) |
| `max_renders` | `integer` (nullable) | Max concurrent renders for non-admin users |
| `max_checkpoints_per_render` | `integer` (nullable) | Max checkpoints per render |
| `max_render_pixel_count` | `integer` (nullable) | Max total pixels for a render |
| `created_at` | `timestamptz` | Account creation time |
| `updated_at` | `timestamptz` | Last update time |

Indexes: `users_pkey` (id), `users_github_id_key` UNIQUE (github_id), `idx_github_id` (github_id)

### Table: `renders`
Render jobs submitted by users. The `config` and `state` columns are JSONB.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `integer` | Primary key |
| `state` | `jsonb` | Render state machine state. Keys: `"created"`, `"running"`, `"pausing"`, `"paused"`, `"finished_checkpoint_iteration"`. When running or pausing, contains nested object with `checkpoint_iteration` and `progress_info` (has `progress` float 0-1) |
| `config` | `jsonb` | Render configuration. Contains `name` (string), `parameters` → `image_dimensions`, `samples_per_checkpoint`, `total_checkpoints`, plus scenes/cameras/geometrics/materials/textures |
| `user_id` | `integer` | FK → `users.id` (indexed) |
| `created_at` | `timestamptz` | Render creation time |
| `updated_at` | `timestamptz` | Last update time |

Indexes: `renders_pkey` (id), `idx_user_id` (user_id)

**Querying JSONB:** Use `->` for JSONB field access (returns jsonb), `->>` for text, and `->>'key'::integer` for casting:

```sql
-- extract render name
SELECT config->>'name' AS name FROM renders;

-- cast nested int
SELECT (config->'parameters'->>'total_checkpoints')::integer AS total FROM renders;

-- check state key
SELECT jsonb_typeof(state), state->'running'->>'checkpoint_iteration' FROM renders;
```

### Table: `checkpoints`
Stored pixel data for each render iteration. Pixel data is bincode-encoded BYTEA.

| Column | Type | Notes |
|--------|------|-------|
| `render_id` | `integer` | FK → `renders.id` (CASCADE delete) |
| `iteration` | `integer` | Checkpoint iteration number |
| `pixel_data` | `bytea` (nullable) | Bincode-encoded pixel data. NULL when `pixel_data_cleared = true` |
| `pixel_data_cleared` | `boolean` | Whether pixel data has been freed to save space |
| `started_at` | `timestamptz` | When checkpoint generation started |
| `ended_at` | `timestamptz` | When checkpoint generation completed |

Primary key: `(render_id, iteration)`. Index: `checkpoints_pkey`.

### View: `render_states`
Flattened view of renders for convenient querying.

| Column | Type | Source |
|--------|------|--------|
| `id` | `integer` | `renders.id` |
| `name` | `jsonb` | `config->'name'` |
| `image_dimensions` | `jsonb` | `config->'parameters'->'image_dimensions'` |
| `samples_per_checkpoint` | `integer` | Cast from config |
| `total_checkpoints` | `integer` | Cast from config |
| `state` | `text` | Extracted state key |
| `checkpoint_iteration` | `integer` (nullable) | Current checkpoint iteration |
| `percent_complete` | `numeric` (nullable) | Progress 0.00–100.00 (only for running/pausing) |

### Table: `_sqlx_migrations`
SQLx migration bookkeeping. Internal use only — not relevant for application queries.

## Common Query Patterns

### User queries
```sql
-- list all users
SELECT id, username, role, created_at FROM users;

-- find user by github_id
SELECT * FROM users WHERE github_id = <github_id>;

-- count renders per user
SELECT u.username, COUNT(r.id) AS render_count
FROM users u LEFT JOIN renders r ON r.user_id = u.id
GROUP BY u.id, u.username;
```

### Render queries
```sql
-- all renders with state info
SELECT id, config->>'name' AS name, 
       (config->'parameters'->>'total_checkpoints')::integer AS total_checkpoints,
       state
FROM renders ORDER BY created_at DESC;

-- renders by state key
SELECT * FROM render_states WHERE state = 'running';

-- renders for a specific user
SELECT rs.* FROM render_states rs JOIN renders r ON rs.id = r.id WHERE r.user_id = 1;

-- count renders by state
SELECT state, COUNT(*) FROM render_states GROUP BY state;

-- recently updated renders
SELECT id, config->>'name', updated_at FROM renders ORDER BY updated_at DESC LIMIT 10;
```

### Checkpoint queries
```sql
-- checkpoint count per render
SELECT render_id, COUNT(*) AS checkpoints,
       MIN(iteration) AS first_iter, MAX(iteration) AS last_iter
FROM checkpoints GROUP BY render_id;

-- checkpoints where pixel data was cleared
SELECT render_id, iteration, ended_at
FROM checkpoints WHERE pixel_data_cleared = true;

-- total storage: checkpoints with vs without pixel data
SELECT pixel_data_cleared, COUNT(*)
FROM checkpoints GROUP BY pixel_data_cleared;
```

### Performance analysis
```sql
-- explain a query
EXPLAIN SELECT * FROM renders WHERE user_id = 1;

-- analyze with hypothetical index
EXPLAIN SELECT * FROM renders ORDER BY created_at DESC;
```

Use `postgres_explain_query` for execution plans and `postgres_analyze_query_indexes` or `postgres_analyze_workload_indexes` for index recommendations.

## Relationship Diagram

```
users (1) ──────< renders (N)
                      │
                      └──────< checkpoints (N) [render_id + iteration]
                                │
render_states ── VIEW over renders
```

- `renders.user_id` → `users.id` (FK, CASCADE)
- `checkpoints.render_id` → `renders.id` (FK, CASCADE DELETE)

## Notes

- **All queries are read-only.** The MCP server runs in `--access-mode=restricted` which parses SQL before execution and rejects any write statements or transaction control.
- **JSONB columns** (`renders.config`, `renders.state`) contain nested render configuration and state machine data. Use PostgreSQL JSONB operators (`->`, `->>`, `#>>`, `jsonb_typeof`, `jsonb_object_keys`, `jsonb_each`) to navigate them.
- **Pixel data** in `checkpoints.pixel_data` is bincode-encoded binary. It cannot be inspected as text — only check its presence (IS NULL / IS NOT NULL) or size (`octet_length(pixel_data)`).
- **The `_sqlx_migrations` table** is SQLx internal bookkeeping. Ignore it for application queries.
- **Timestamps** use `timestamptz` (with time zone). All times are stored in UTC.
