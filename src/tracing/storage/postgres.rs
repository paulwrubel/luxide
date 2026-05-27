use sqlx::{Pool, Postgres};

use crate::utils::{ProgressInfo, decode_pixel_data, encode_pixel_data};

use super::{
    GithubID, Render, RenderCheckpoint, RenderCheckpointMeta, RenderID, RenderState, RenderStorage,
    StorageError, User, UserID, UserStorage,
};

#[derive(Clone)]
pub struct PostgresStorage {
    pool: Pool<Postgres>,
}

impl PostgresStorage {
    pub async fn new(
        addr: &str,
        username: &str,
        password: &str,
        database: &str,
    ) -> Result<Self, String> {
        let conn_string = format!("postgres://{}:{}@{}/{}", username, password, addr, database);

        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(5)
            .connect(&conn_string)
            .await
            .map_err(|e| e.to_string())?;

        Ok(Self { pool })
    }
}

#[async_trait::async_trait]
impl RenderStorage for PostgresStorage {
    async fn get_render(&self, id: RenderID) -> Result<Option<Render>, StorageError> {
        match sqlx::query!(
            r#"
                SELECT id, state, created_at, updated_at, config, user_id
                FROM renders
                WHERE id = $1
            "#,
            id as i32
        )
        .fetch_optional(&self.pool)
        .await
        {
            Ok(Some(row)) => {
                let state = serde_json::from_value(row.state).map_err(|e| {
                    format!("Failed to deserialize render state for id {}: {}", id, e)
                })?;

                let config = serde_json::from_value(row.config).map_err(|e| {
                    format!("Failed to deserialize render config for id {}: {}", id, e)
                })?;

                let db_id: RenderID = row
                    .id
                    .try_into()
                    .map_err(|_| "Invalid render ID (negative or too large)".to_string())?;
                Ok(Some(Render {
                    id: db_id,
                    state,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    config,
                    user_id: row.user_id as UserID,
                }))
            }
            Ok(None) => Ok(None),
            Err(e) => Err(format!("Failed to get render with id {id}: {e}").into()),
        }
    }

    async fn render_exists(&self, id: RenderID) -> Result<bool, StorageError> {
        match sqlx::query!(
            r#"
                SELECT 1 as exists
                FROM renders
                WHERE id = $1
                LIMIT 1
            "#,
            id as i32
        )
        .fetch_optional(&self.pool)
        .await
        {
            Ok(Some(_)) => Ok(true),
            Ok(None) => Ok(false),
            Err(e) => Err(format!("Failed to check if render with id {id} exists: {e}").into()),
        }
    }

    async fn render_belongs_to(&self, id: RenderID, user_id: UserID) -> Result<bool, StorageError> {
        match sqlx::query!(
            r#"
                SELECT 1 as exists
                FROM renders
                WHERE id = $1 AND user_id = $2
                LIMIT 1
            "#,
            id as i32,
            user_id as i32
        )
        .fetch_optional(&self.pool)
        .await
        {
            Ok(Some(_)) => Ok(true),
            Ok(None) => Ok(false),
            Err(e) => Err(format!(
                "Failed to check if render with id {id} belongs to user {user_id}: {e}"
            )
            .into()),
        }
    }

    async fn get_render_count_for_user(&self, user_id: UserID) -> Result<u32, StorageError> {
        match sqlx::query!(
            r#"
                SELECT count(*)
                FROM renders
                WHERE user_id = $1
            "#,
            user_id as i32
        )
        .fetch_one(&self.pool)
        .await
        {
            Ok(row) => Ok(row.count.expect("count should be present") as u32),
            Err(e) => Err(format!("Failed to get render count for user {user_id}: {e}").into()),
        }
    }

    async fn get_all_renders(&self) -> Result<Vec<Render>, StorageError> {
        let rows = sqlx::query!(
            r#"
                SELECT id, state, created_at, updated_at, config, user_id
                FROM renders
                ORDER BY id ASC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to get all renders: {}", e))?;

        let mut renders = Vec::with_capacity(rows.len());
        for row in rows {
            let state = serde_json::from_value(row.state).map_err(|e| {
                format!(
                    "Failed to deserialize render state for id {}: {}",
                    row.id, e
                )
            })?;
            let config = serde_json::from_value(row.config).map_err(|e| {
                format!(
                    "Failed to deserialize render config for id {}: {}",
                    row.id, e
                )
            })?;

            renders.push(Render {
                id: row
                    .id
                    .try_into()
                    .map_err(|_| "Invalid render ID (negative or too large)".to_string())?,
                state,
                created_at: row.created_at,
                updated_at: row.updated_at,
                config,
                user_id: row.user_id as UserID,
            });
        }

        Ok(renders)
    }

    async fn get_all_renders_for_user_id(
        &self,
        user_id: UserID,
    ) -> Result<Vec<Render>, StorageError> {
        let rows = sqlx::query!(
            r#"
                SELECT id, state, created_at, updated_at, config
                FROM renders
                WHERE user_id = $1
                ORDER BY id ASC
            "#,
            user_id as i32,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to get all renders for user id {}: {}", user_id, e))?;

        let mut renders = Vec::with_capacity(rows.len());
        for row in rows {
            let state = serde_json::from_value(row.state).map_err(|e| {
                format!(
                    "Failed to deserialize render state for id {}: {}",
                    row.id, e
                )
            })?;
            let config = serde_json::from_value(row.config).map_err(|e| {
                format!(
                    "Failed to deserialize render config for id {}: {}",
                    row.id, e
                )
            })?;

            renders.push(Render {
                id: row
                    .id
                    .try_into()
                    .map_err(|_| "Invalid render ID (negative or too large)".to_string())?,
                state,
                created_at: row.created_at,
                updated_at: row.updated_at,
                config,
                user_id,
            });
        }

        Ok(renders)
    }

    async fn create_render(&self, render: Render) -> Result<Render, StorageError> {
        match sqlx::query!(
            r#"
                INSERT INTO renders (id, state, created_at, updated_at, config, user_id)
                VALUES ($1, $2, $3, $4, $5, $6)
            "#,
            render.id as i32,
            serde_json::to_value(&render.state).map_err(|e| format!(
                "Failed to serialize render state for id {}: {}",
                render.id, e
            ))?,
            render.created_at,
            render.updated_at,
            serde_json::to_value(&render.config).map_err(|e| format!(
                "Failed to serialize render config for id {}: {}",
                render.id, e
            ))?,
            render.user_id as i32,
        )
        .execute(&self.pool)
        .await
        {
            Ok(res) => match res.rows_affected() {
                1 => Ok(render),
                n => Err(
                    format!("Failed to create render. Expecting 1 row affected, got {n}").into(),
                ),
            },
            Err(e) => Err(format!("Failed to create render for id {}: {}", render.id, e).into()),
        }
    }

    async fn update_render_state(
        &self,
        id: RenderID,
        new_state: RenderState,
    ) -> Result<(), StorageError> {
        match sqlx::query!(
            r#"
                UPDATE renders
                SET state = $2, updated_at = $3
                WHERE id = $1
            "#,
            id as i32,
            serde_json::to_value(&new_state)
                .map_err(|e| format!("Failed to serialize render state for id {}: {}", id, e))?,
            chrono::Utc::now(),
        )
        .execute(&self.pool)
        .await
        {
            Ok(res) => match res.rows_affected() {
                1 => Ok(()),
                n => Err(format!(
                    "Failed to update render state. Expecting 1 row affected, got {n}"
                )
                .into()),
            },
            Err(e) => Err(format!("Failed to update render state for id {}: {}", id, e).into()),
        }
    }

    async fn update_render_progress(
        &self,
        id: RenderID,
        progress_info: ProgressInfo,
    ) -> Result<(), StorageError> {
        // only update if current state is Running or Pausing, preserving the checkpoint_iteration
        sqlx::query!(
            r#"
                UPDATE renders
                SET state = CASE
                    WHEN state ? 'running' THEN jsonb_set(state, '{running,progress_info}', $2::jsonb)
                    WHEN state ? 'pausing' THEN jsonb_set(state, '{pausing,progress_info}', $2::jsonb)
                    ELSE state
                END,
                updated_at = $3
                WHERE id = $1
                AND (state ? 'running' OR state ? 'pausing')
            "#,
            id as i32,
            serde_json::to_value(&progress_info).map_err(|e| format!("Failed to serialize render progress for id {}: {}", id, e))?,
            chrono::Utc::now(),
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to update render progress for id {}: {}", id, e))?;

        Ok(())
    }

    async fn update_render_total_checkpoints(
        &self,
        id: RenderID,
        new_total_checkpoints: u32,
    ) -> Result<(), StorageError> {
        sqlx::query!(
            r#"
                UPDATE renders
                SET config = jsonb_set(config, '{parameters,total_checkpoints}', $2::jsonb),
                updated_at = $3
                WHERE id = $1
            "#,
            id as i32,
            serde_json::to_value(&new_total_checkpoints).map_err(|e| format!(
                "Failed to serialize render total_checkpoints for id {}: {}",
                id, e
            ))?,
            chrono::Utc::now(),
        )
        .execute(&self.pool)
        .await
        .map_err(|e| {
            format!(
                "Failed to update render total_checkpoints for id {}: {}",
                id, e
            )
        })?;

        Ok(())
    }

    async fn get_render_checkpoint(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Result<Option<RenderCheckpoint>, StorageError> {
        match sqlx::query!(
            r#"
                SELECT pixel_data, started_at, ended_at
                FROM checkpoints
                WHERE render_id = $1 AND iteration = $2
            "#,
            id as i32,
            iteration as i32,
        )
        .fetch_optional(&self.pool)
        .await
        {
            Ok(Some(row)) => {
                let pixel_data = decode_pixel_data(&row.pixel_data).map_err(|e| {
                    format!(
                        "Failed to decode pixel data for id {} and iteration {}: {}",
                        id, iteration, e
                    )
                })?;

                Ok(Some(RenderCheckpoint {
                    render_id: id,
                    iteration,
                    pixel_data,
                    started_at: row.started_at,
                    ended_at: row.ended_at,
                }))
            }
            Ok(None) => Ok(None),
            Err(e) => Err(format!(
                "Failed to get render checkpoint with id {id} and iteration {iteration}: {e}"
            )
            .into()),
        }
    }

    async fn get_render_checkpoint_count(&self, id: RenderID) -> Result<u32, StorageError> {
        match sqlx::query!(
            r#"
                SELECT count(*)
                FROM checkpoints
                WHERE render_id = $1
            "#,
            id as i32,
        )
        .fetch_one(&self.pool)
        .await
        {
            Ok(row) => Ok(row.count.expect("count should be present") as u32),
            Err(e) => Err(format!("Failed to get render checkpoint count for id {id}: {e}").into()),
        }
    }

    async fn get_earliest_render_checkpoint_iteration(
        &self,
        id: RenderID,
    ) -> Result<Option<u32>, StorageError> {
        match sqlx::query!(
            r#"
                SELECT min(iteration)
                FROM checkpoints
                WHERE render_id = $1
            "#,
            id as i32,
        )
        .fetch_one(&self.pool)
        .await
        {
            Ok(row) => Ok(row.min.map(|min| min as u32)),
            Err(e) => Err(format!(
                "Failed to get earliest render checkpoint iteration for id {id}: {e}"
            )
            .into()),
        }
    }

    async fn get_latest_render_checkpoint_iteration(
        &self,
        id: RenderID,
    ) -> Result<Option<u32>, StorageError> {
        match sqlx::query!(
            r#"
                SELECT max(iteration)
                FROM checkpoints
                WHERE render_id = $1
            "#,
            id as i32,
        )
        .fetch_one(&self.pool)
        .await
        {
            Ok(row) => Ok(row.max.map(|max| max as u32)),
            Err(e) => Err(format!(
                "Failed to get latest render checkpoint iteration for id {id}: {e}"
            )
            .into()),
        }
    }

    async fn get_render_checkpoints_without_data(
        &self,
        id: RenderID,
    ) -> Result<Vec<RenderCheckpointMeta>, StorageError> {
        match sqlx::query!(
            r#"
                SELECT render_id, iteration, started_at, ended_at
                FROM checkpoints
                WHERE render_id = $1
            "#,
            id as i32,
        )
        .fetch_all(&self.pool)
        .await
        {
            Ok(rows) => Ok(rows
                .iter()
                .map(|row| RenderCheckpointMeta {
                    render_id: id,
                    iteration: row.iteration as u32,
                    started_at: row.started_at,
                    ended_at: row.ended_at,
                })
                .collect()),
            Err(e) => Err(format!(
                "Failed to get render checkpoints without data for id {id}: {e}"
            )
            .into()),
        }
    }

    async fn render_checkpoint_exists(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Result<bool, StorageError> {
        match sqlx::query!(
            r#"
                SELECT 1 as exists
                FROM checkpoints
                WHERE render_id = $1 AND iteration = $2
                LIMIT 1
            "#,
            id as i32,
            iteration as i32,
        )
        .fetch_optional(&self.pool)
        .await
        {
            Ok(Some(_)) => Ok(true),
            Ok(None) => Ok(false),
            Err(e) => Err(format!("Failed to check if render checkpoint with id {id} and iteration {iteration} exists: {e}").into()),
        }
    }

    async fn create_render_checkpoint(
        &self,
        render_checkpoint: RenderCheckpoint,
    ) -> Result<(), StorageError> {
        let pixel_data = encode_pixel_data(&render_checkpoint.pixel_data).map_err(|e| {
            format!(
                "Failed to encode pixel data for id {} and iteration {}: {}",
                render_checkpoint.render_id, render_checkpoint.iteration, e
            )
        })?;

        match sqlx::query!(
            r#"
                INSERT INTO checkpoints (render_id, iteration, pixel_data, started_at, ended_at)
                VALUES ($1, $2, $3, $4, $5)
            "#,
            render_checkpoint.render_id as i32,
            render_checkpoint.iteration as i32,
            &pixel_data,
            render_checkpoint.started_at,
            render_checkpoint.ended_at,
        )
        .execute(&self.pool)
        .await
        {
            Ok(res) => match res.rows_affected() {
                1 => Ok(()),
                n => Err(format!(
                    "Failed to create render checkpoint for id {} and iteration {}: Expecting 1 row affected, got {}", 
                    render_checkpoint.render_id, render_checkpoint.iteration, n
                )
                .into()),
            },
            Err(e) => Err(format!("Failed to create render checkpoint for id {} and iteration {}: {}", render_checkpoint.render_id, render_checkpoint.iteration, e).into()),
        }
    }

    async fn delete_render_checkpoint(
        &self,
        id: RenderID,
        checkpoint: u32,
    ) -> Result<(), StorageError> {
        match sqlx::query!(
            r#"
                DELETE FROM checkpoints
                WHERE render_id = $1 AND iteration = $2
            "#,
            id as i32,
            checkpoint as i32,
        )
        .execute(&self.pool)
        .await
        {
            Ok(res) => match res.rows_affected() {
                1 => Ok(()),
                n => Err(format!(
                    "Failed to delete render checkpoint for id {} and iteration {}: Expecting 1 row affected, got {}", 
                    id, checkpoint, n
                )
                .into()),
            },
            Err(e) => Err(format!("Failed to delete render checkpoint for id {} and iteration {}: {}", id, checkpoint, e).into()),
        }
    }

    async fn delete_render_and_checkpoints(&self, id: RenderID) -> Result<(), StorageError> {
        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| format!("Failed to begin transaction: {}", e))?;

        // delete checkpoints first (foreign key constraint will prevent orphaned checkpoints)
        sqlx::query!(
            r#"
                DELETE FROM checkpoints
                WHERE render_id = $1
            "#,
            id as i32
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to delete checkpoints for render id {}: {}", id, e))?;

        // delete the render
        sqlx::query!(
            r#"
                DELETE FROM renders
                WHERE id = $1
            "#,
            id as i32
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to delete render for id {}: {}", id, e))?;

        // commit the transaction
        tx.commit()
            .await
            .map_err(|e| format!("Failed to commit transaction: {}", e))?;

        Ok(())
    }

    async fn get_next_id(&self) -> Result<RenderID, StorageError> {
        let row = sqlx::query!(
            r#"
                SELECT COALESCE(MAX(id), 0) as max_id
                FROM renders
            "#
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to get next render ID: {}", e))?;

        let next_id = row.max_id.unwrap_or(0) + 1;
        Ok(next_id
            .try_into()
            .map_err(|_| "Next render ID is too large".to_string())?)
    }

    async fn get_render_checkpoint_storage_usage_bytes(&self) -> Result<u64, StorageError> {
        let rows = sqlx::query!(
            r#"
                SELECT sum(length(pixel_data))
                FROM checkpoints
            "#
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to get render checkpoint storage usage: {}", e))?;

        Ok(rows.sum.unwrap_or(0) as u64)
    }
}

#[async_trait::async_trait]
impl UserStorage for PostgresStorage {
    async fn get_user(&self, id: UserID) -> Result<Option<User>, StorageError> {
        match sqlx::query!(
            r#"
                SELECT id, github_id, username, avatar_url, created_at, updated_at, 
                    role, max_renders, max_checkpoints_per_render, max_render_pixel_count
                FROM users
                WHERE id = $1
            "#,
            id as i32,
        )
        .fetch_optional(&self.pool)
        .await
        {
            Ok(Some(row)) => Ok(Some(User {
                id: row.id as UserID,
                github_id: row.github_id as GithubID,
                username: row.username,
                avatar_url: row.avatar_url,
                created_at: row.created_at,
                updated_at: row.updated_at,
                role: row.role.into(),
                max_renders: row.max_renders.map(|r| r as u32),
                max_checkpoints_per_render: row.max_checkpoints_per_render.map(|c| c as u32),
                max_render_pixel_count: row.max_render_pixel_count.map(|p| p as u32),
            })),
            Ok(None) => Ok(None),
            Err(e) => Err(format!("Failed to get user with id {}: {}", id, e).into()),
        }
    }

    async fn get_user_by_github_id(
        &self,
        github_id: GithubID,
    ) -> Result<Option<User>, StorageError> {
        match sqlx::query!(
            r#"
                SELECT id, github_id, username, avatar_url, created_at, updated_at, 
                    role, max_renders, max_checkpoints_per_render, max_render_pixel_count
                FROM users
                WHERE github_id = $1
            "#,
            github_id as i32,
        )
        .fetch_optional(&self.pool)
        .await
        {
            Ok(Some(row)) => Ok(Some(User {
                id: row.id as UserID,
                github_id: row.github_id as GithubID,
                username: row.username,
                avatar_url: row.avatar_url,
                created_at: row.created_at,
                updated_at: row.updated_at,
                role: row.role.into(),
                max_renders: row.max_renders.map(|r| r as u32),
                max_checkpoints_per_render: row.max_checkpoints_per_render.map(|c| c as u32),
                max_render_pixel_count: row.max_render_pixel_count.map(|p| p as u32),
            })),
            Ok(None) => Ok(None),
            Err(e) => Err(format!("Failed to get user with github id {}: {}", github_id, e).into()),
        }
    }

    async fn user_exists(&self, id: UserID) -> Result<bool, StorageError> {
        match sqlx::query!(
            r#"
                SELECT 1 as exists
                FROM users
                WHERE id = $1
                LIMIT 1
            "#,
            id as i32,
        )
        .fetch_optional(&self.pool)
        .await
        {
            Ok(Some(_)) => Ok(true),
            Ok(None) => Ok(false),
            Err(e) => Err(format!("Failed to check if user with id {} exists: {}", id, e).into()),
        }
    }

    async fn user_exists_by_github_id(&self, github_id: GithubID) -> Result<bool, StorageError> {
        match sqlx::query!(
            r#"
                SELECT 1 as exists
                FROM users
                WHERE github_id = $1
                LIMIT 1
            "#,
            github_id as i32,
        )
        .fetch_optional(&self.pool)
        .await
        {
            Ok(Some(_)) => Ok(true),
            Ok(None) => Ok(false),
            Err(e) => Err(format!(
                "Failed to check if user with github id {} exists: {}",
                github_id, e
            )
            .into()),
        }
    }

    async fn create_user(&self, user: User) -> Result<User, StorageError> {
        match sqlx::query!(
            r#"
                INSERT INTO users (id, github_id, username, avatar_url, created_at, updated_at,
                    role, max_renders, max_checkpoints_per_render, max_render_pixel_count)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            "#,
            user.id as i32,
            user.github_id as i32,
            user.username,
            user.avatar_url,
            chrono::Utc::now(),
            chrono::Utc::now(),
            user.role.to_string(),
            user.max_renders.map(|r| r as i32),
            user.max_checkpoints_per_render.map(|c| c as i32),
            user.max_render_pixel_count.map(|p| p as i32),
        )
        .execute(&self.pool)
        .await
        {
            Ok(res) => match res.rows_affected() {
                1 => Ok(user),
                n => Err(
                    format!("Failed to create user: Expecting 1 row affected, got {}", n).into(),
                ),
            },
            Err(e) => Err(format!("Failed to create user: {}", e).into()),
        }
    }

    async fn update_user(&self, user: User) -> Result<User, StorageError> {
        match sqlx::query!(
            r#"
                UPDATE users
                SET github_id = $2, username = $3, avatar_url = $4, updated_at = $5, role = $6, 
                    max_renders = $7, max_checkpoints_per_render = $8, max_render_pixel_count = $9
                WHERE id = $1
            "#,
            user.id as i32,
            user.github_id as i32,
            user.username,
            user.avatar_url,
            chrono::Utc::now(),
            user.role.to_string(),
            user.max_renders.map(|r| r as i32),
            user.max_checkpoints_per_render.map(|c| c as i32),
            user.max_render_pixel_count.map(|p| p as i32),
        )
        .execute(&self.pool)
        .await
        {
            Ok(res) => match res.rows_affected() {
                1 => Ok(user),
                n => Err(
                    format!("Failed to update user: Expecting 1 row affected, got {}", n).into(),
                ),
            },
            Err(e) => Err(format!("Failed to update user: {}", e).into()),
        }
    }

    async fn delete_user(&self, id: UserID) -> Result<(), StorageError> {
        match sqlx::query!(
            r#"
                DELETE FROM users
                WHERE id = $1
            "#,
            id as i32,
        )
        .execute(&self.pool)
        .await
        {
            Ok(res) => match res.rows_affected() {
                1 => Ok(()),
                n => Err(
                    format!("Failed to delete user: Expecting 1 row affected, got {}", n).into(),
                ),
            },
            Err(e) => Err(format!("Failed to delete user: {}", e).into()),
        }
    }

    async fn get_next_user_id(&self) -> Result<UserID, StorageError> {
        match sqlx::query!(
            r#"
                SELECT COALESCE(MAX(id), 0) as max_id
                FROM users
            "#,
        )
        .fetch_one(&self.pool)
        .await
        {
            Ok(row) => {
                let next_id = row.max_id.unwrap_or(0) + 1;
                Ok(next_id
                    .try_into()
                    .map_err(|_| "Next user ID cannot be represented as a UserID".to_string())?)
            }
            Err(e) => Err(format!("Failed to get next user ID: {}", e).into()),
        }
    }
}
