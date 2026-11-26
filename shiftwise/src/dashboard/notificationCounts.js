export function unreadSwapNotificationCounts(notifications = [], swapRequests = []) {
  const seen = new Set();
  const pendingRequestIds = new Set(swapRequests
    .filter((request) => request.kind === 'swap' && request.status === 'Pending')
    .map((request) => String(request.id)));
  return notifications.reduce((counts, notification) => {
    if (notification.read) return counts;
    const id = notification.id || notification._id;
    if (id && seen.has(String(id))) return counts;
    if (id) seen.add(String(id));

    const requestId = notification.relatedSwapRequest && String(notification.relatedSwapRequest);
    if (!requestId || !pendingRequestIds.has(requestId)) return counts;
    const direction = notification.swapDirection;
    if (direction === 'incoming') counts.incoming += 1;
    if (direction === 'outgoing') counts.outgoing += 1;
    return counts;
  }, { incoming: 0, outgoing: 0 });
}
