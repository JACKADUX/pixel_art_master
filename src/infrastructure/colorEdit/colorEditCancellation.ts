let cancelledJobId: number | null = null;

export function requestCancelColorEdit(jobId: number): void {
  if (jobId > 0) {
    cancelledJobId = jobId;
  }
}

export function isColorEditCancelled(jobId: number): boolean {
  return jobId > 0 && cancelledJobId === jobId;
}

export function clearColorEditCancel(jobId: number): void {
  if (jobId > 0 && cancelledJobId === jobId) {
    cancelledJobId = null;
  }
}

export function assertColorEditNotCancelled(jobId: number): void {
  if (isColorEditCancelled(jobId)) {
    clearColorEditCancel(jobId);
    throw new Error("处理已中断");
  }
}
