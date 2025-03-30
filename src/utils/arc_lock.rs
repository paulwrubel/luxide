use std::sync::{Arc, LockResult, RwLock, RwLockReadGuard, RwLockWriteGuard};

pub struct ArcLock<T: ?Sized>(Arc<RwLock<T>>);

impl<T> ArcLock<T> {
    pub fn new(value: T) -> Self {
        Self(Arc::new(RwLock::new(value)))
    }

    pub fn read(&self) -> LockResult<RwLockReadGuard<T>> {
        self.0.read()
    }

    pub fn write(&self) -> LockResult<RwLockWriteGuard<T>> {
        self.0.write()
    }

    pub fn read_only(&self) -> ReadOnlyArcLock<T> {
        ReadOnlyArcLock(Arc::clone(&self.0))
    }
}

impl<T> Clone for ArcLock<T> {
    fn clone(&self) -> Self {
        Self(Arc::clone(&self.0))
    }
}

pub struct ReadOnlyArcLock<T: ?Sized>(Arc<RwLock<T>>);

impl<T> ReadOnlyArcLock<T> {
    pub fn read(&self) -> LockResult<RwLockReadGuard<T>> {
        self.0.read()
    }
}

impl<T> Clone for ReadOnlyArcLock<T> {
    fn clone(&self) -> Self {
        Self(Arc::clone(&self.0))
    }
}
