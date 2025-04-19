pub struct Synchronizer {
    runtime: tokio::runtime::Runtime,
}

impl Synchronizer {
    pub fn new() -> Self {
        Self {
            runtime: tokio::runtime::Runtime::new().unwrap(),
        }
    }

    pub fn block_on<F>(&self, future: F) -> F::Output
    where
        F: Future,
    {
        self.runtime.block_on(future)
    }

    pub fn spawn<F>(&self, future: F) -> tokio::task::JoinHandle<F::Output>
    where
        F: Future + Send + 'static,
        F::Output: Send + 'static,
    {
        self.runtime.spawn(future)
    }
}

impl Clone for Synchronizer {
    fn clone(&self) -> Self {
        Self {
            runtime: tokio::runtime::Runtime::new().unwrap(),
        }
    }
}
