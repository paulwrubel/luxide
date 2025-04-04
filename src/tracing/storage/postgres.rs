use sqlx::{Pool, Postgres};

use crate::utils::{ProgressInfo, decode_pixel_data, encode_pixel_data};

use super::{Render, RenderCheckpoint, RenderID, RenderState, RenderStorage, RenderStorageError};

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
    async fn get_render(&self, id: RenderID) -> Result<Option<Render>, RenderStorageError> {
        match sqlx::query!(
            r#"
                SELECT id, state, config 
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
                    config,
                }))
            }
            Ok(None) => Ok(None),
            Err(e) => Err(format!("Failed to get render with id {id}: {e}").into()),
        }
    }

    async fn render_exists(&self, id: RenderID) -> Result<bool, RenderStorageError> {
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

    async fn get_all_renders(&self) -> Result<Vec<Render>, RenderStorageError> {
        let rows = sqlx::query!(
            r#"
                SELECT id, state, config
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
                config,
            });
        }

        Ok(renders)
    }

    async fn create_render(&self, render: Render) -> Result<Render, RenderStorageError> {
        match sqlx::query!(
            r#"
                INSERT INTO renders (id, state, config)
                VALUES ($1, $2, $3)
            "#,
            render.id as i32,
            serde_json::to_value(&render.state).map_err(|e| format!(
                "Failed to serialize render state for id {}: {}",
                render.id, e
            ))?,
            serde_json::to_value(&render.config).map_err(|e| format!(
                "Failed to serialize render config for id {}: {}",
                render.id, e
            ))?,
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
    ) -> Result<(), RenderStorageError> {
        match sqlx::query!(
            r#"
                UPDATE renders
                SET state = $1
                WHERE id = $2
            "#,
            serde_json::to_value(&new_state)
                .map_err(|e| format!("Failed to serialize render state for id {}: {}", id, e))?,
            id as i32,
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
    ) -> Result<(), RenderStorageError> {
        // only update if current state is Running or Pausing, preserving the checkpoint_iteration
        sqlx::query!(
            r#"
                UPDATE renders
                SET state = CASE
                    WHEN state ? 'running' THEN jsonb_set(state, '{running,progress_info}', $1::jsonb)
                    WHEN state ? 'pausing' THEN jsonb_set(state, '{pausing,progress_info}', $1::jsonb)
                    ELSE state
                END
                WHERE id = $2
                AND (state ? 'running' OR state ? 'pausing')
            "#,
            serde_json::to_value(&progress_info).map_err(|e| format!("Failed to serialize render progress for id {}: {}", id, e))?,
            id as i32
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to update render progress for id {}: {}", id, e))?;

        Ok(())
    }

    async fn update_render_checkpoints(
        &self,
        id: RenderID,
        new_total_checkpoints: u32,
    ) -> Result<(), RenderStorageError> {
        sqlx::query!(
            r#"
                UPDATE renders
                SET config = jsonb_set(config, '{parameters,checkpoints}', $1::jsonb)
                WHERE id = $2
            "#,
            serde_json::to_value(&new_total_checkpoints).map_err(|e| format!(
                "Failed to serialize render checkpoints for id {}: {}",
                id, e
            ))?,
            id as i32
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to update render checkpoints for id {}: {}", id, e))?;

        Ok(())
    }

    async fn get_render_checkpoint(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Result<Option<RenderCheckpoint>, RenderStorageError> {
        match sqlx::query!(
            r#"
                SELECT pixel_data
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
                }))
            }
            Ok(None) => Ok(None),
            Err(e) => Err(format!(
                "Failed to get render checkpoint with id {id} and iteration {iteration}: {e}"
            )
            .into()),
        }
    }

    async fn render_checkpoint_exists(
        &self,
        id: RenderID,
        iteration: u32,
    ) -> Result<bool, RenderStorageError> {
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
    ) -> Result<(), RenderStorageError> {
        let pixel_data = encode_pixel_data(&render_checkpoint.pixel_data).map_err(|e| {
            format!(
                "Failed to encode pixel data for id {} and iteration {}: {}",
                render_checkpoint.render_id, render_checkpoint.iteration, e
            )
        })?;

        match sqlx::query!(
            r#"
                INSERT INTO checkpoints (render_id, iteration, pixel_data)
                VALUES ($1, $2, $3)
            "#,
            render_checkpoint.render_id as i32,
            render_checkpoint.iteration as i32,
            &pixel_data,
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

    async fn delete_render_and_checkpoints(&self, id: RenderID) -> Result<(), RenderStorageError> {
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

    async fn get_next_id(&self) -> Result<RenderID, RenderStorageError> {
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
}
