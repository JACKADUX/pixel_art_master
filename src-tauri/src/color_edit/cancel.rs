use std::sync::atomic::{AtomicU64, Ordering};

static CANCEL_REQUESTED_FOR: AtomicU64 = AtomicU64::new(0);

pub fn request_cancel(job_id: u64) {
    if job_id != 0 {
        CANCEL_REQUESTED_FOR.store(job_id, Ordering::SeqCst);
    }
}

pub fn is_cancelled(job_id: u64) -> bool {
    job_id != 0 && CANCEL_REQUESTED_FOR.load(Ordering::SeqCst) == job_id
}

pub fn clear_cancel(job_id: u64) {
    if job_id != 0 && CANCEL_REQUESTED_FOR.load(Ordering::SeqCst) == job_id {
        CANCEL_REQUESTED_FOR.store(0, Ordering::SeqCst);
    }
}

pub fn check_cancelled(job_id: u64) -> Result<(), String> {
    if is_cancelled(job_id) {
        clear_cancel(job_id);
        Err("处理已中断".to_string())
    } else {
        Ok(())
    }
}
