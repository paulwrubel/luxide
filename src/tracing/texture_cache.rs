use std::{
    collections::HashMap,
    sync::{Arc, RwLock},
    time::{Duration, Instant},
};

use crate::shading::textures::ImageLinearF64;

use super::ResourceID;

pub(crate) const TEXTURE_CACHE_TTL: Duration = Duration::from_secs(300); // 5 minutes
pub(crate) const TEXTURE_CACHE_EVICTION_INTERVAL: Duration = Duration::from_secs(30);

struct CacheEntry {
    texture: Arc<ImageLinearF64>,
    last_accessed: Instant,
}

pub(crate) struct TextureCache {
    entries: RwLock<HashMap<ResourceID, CacheEntry>>,
}

impl TextureCache {
    pub(crate) fn new() -> Arc<Self> {
        let cache = Arc::new(Self {
            entries: RwLock::new(HashMap::new()),
        });

        // spawn periodic eviction
        let cache_clone = Arc::clone(&cache);
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(TEXTURE_CACHE_EVICTION_INTERVAL).await;
                cache_clone.evict_expired(TEXTURE_CACHE_TTL);
            }
        });

        cache
    }

    // returns a clone if found, and updates last_accessed
    pub(crate) fn get(&self, key: &ResourceID) -> Option<Arc<ImageLinearF64>> {
        let mut entries = self.entries.write().unwrap();
        if let Some(entry) = entries.get_mut(key) {
            entry.last_accessed = Instant::now();
            Some(Arc::clone(&entry.texture))
        } else {
            None
        }
    }

    pub(crate) fn insert(&self, key: ResourceID, texture: Arc<ImageLinearF64>) {
        let mut entries = self.entries.write().unwrap();
        entries.insert(
            key,
            CacheEntry {
                texture,
                last_accessed: Instant::now(),
            },
        );
    }

    pub(crate) fn evict_expired(&self, ttl: Duration) {
        let now = Instant::now();
        let mut entries = self.entries.write().unwrap();
        entries.retain(|_, entry| now.duration_since(entry.last_accessed) < ttl);
    }
}
