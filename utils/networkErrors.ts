export function isOfflineError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === 'string'
        ? error.toLowerCase()
        : '';

  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed')
  );
}

export function getFriendlyDataError(error: unknown): string {
  if (isOfflineError(error)) {
    return 'لا يوجد اتصال بالإنترنت حالياً. يرجى التحقق من الشبكة ثم إعادة المحاولة.';
  }
  return 'تعذر تحميل البيانات حالياً. يرجى المحاولة مرة أخرى بعد قليل.';
}
