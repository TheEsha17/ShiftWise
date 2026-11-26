import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unreadSwapNotificationCounts } from './notificationCounts.js';

test('counts unread swap notifications only while their linked request is pending', () => {
  const requests = [
    { id: 'request-in', kind: 'swap', status: 'Pending' },
    { id: 'request-out', kind: 'swap', status: 'Pending' },
    { id: 'request-read', kind: 'swap', status: 'Pending' },
    { id: 'request-accepted', kind: 'swap', status: 'Accepted' },
    { id: 'request-rejected', kind: 'swap', status: 'Rejected' },
    { id: 'request-change', kind: 'change', status: 'Pending' },
  ];
  const counts = unreadSwapNotificationCounts([
    { id: 'in-1', read: false, swapDirection: 'incoming', relatedSwapRequest: 'request-in' },
    { id: 'out-1', read: false, swapDirection: 'outgoing', relatedSwapRequest: 'request-out' },
    { id: 'out-1', read: false, swapDirection: 'outgoing', relatedSwapRequest: 'request-out' },
    { id: 'read-in', read: true, swapDirection: 'incoming', relatedSwapRequest: 'request-read' },
    { id: 'accepted-in', read: false, swapDirection: 'incoming', relatedSwapRequest: 'request-accepted' },
    { id: 'rejected-out', read: false, swapDirection: 'outgoing', relatedSwapRequest: 'request-rejected' },
    { id: 'unrelated', read: false, swapDirection: 'incoming', relatedSwapRequest: 'request-change' },
    { id: 'orphan', read: false, title: 'Incoming shift swap request' },
  ], requests);
  assert.deepEqual(counts, { incoming: 1, outgoing: 1 });
  assert.deepEqual(requests.filter((request) => request.kind === 'swap').map((request) => request.status), [
    'Pending', 'Pending', 'Pending', 'Accepted', 'Rejected',
  ], 'counting must not alter request history');
});

test('status resolution immediately removes an unread notification from its tab count without marking it read', () => {
  const notification = { id: 'swap-notif', read: false, swapDirection: 'incoming', relatedSwapRequest: 'swap-1' };
  const request = { id: 'swap-1', kind: 'swap', status: 'Pending' };
  assert.deepEqual(unreadSwapNotificationCounts([notification], [request]), { incoming: 1, outgoing: 0 });
  request.status = 'Accepted';
  assert.deepEqual(unreadSwapNotificationCounts([notification], [request]), { incoming: 0, outgoing: 0 });
  assert.equal(notification.read, false);
});
