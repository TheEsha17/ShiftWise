const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  incomingSwapNotification,
  outgoingSwapRequestNotification,
  outgoingSwapNotification,
} = require("../utils/swapNotifications");

test("incoming swap notification uses the selected target employee MongoDB ID", () => {
  const employeeBId = "bbbbbbbbbbbbbbbbbbbbbbbb";
  const requestId = "cccccccccccccccccccccccc";
  const notification = incomingSwapNotification({
    recipient: employeeBId,
    requestId,
    requesterName: "Employee A",
  });
  assert.equal(notification.recipient, employeeBId);
  assert.equal(notification.relatedSwapRequest, requestId);
  assert.equal(notification.swapDirection, "incoming");
  assert.equal(notification.read, undefined, "MongoDB schema defaults new notifications to unread");
});

test("swap response notification is linked to the outgoing request", () => {
  const notification = outgoingSwapNotification({
    recipient: "aaaaaaaaaaaaaaaaaaaaaaaa",
    requestId: "cccccccccccccccccccccccc",
    responderName: "Employee B",
    status: "Accepted",
  });
  assert.equal(notification.swapDirection, "outgoing");
  assert.equal(notification.relatedSwapRequest, "cccccccccccccccccccccccc");
  assert.equal(notification.title, "Shift swap accepted");
});

test("outgoing requester receives one unread notification for the submitted swap", () => {
  const notification = outgoingSwapRequestNotification({
    recipient: "aaaaaaaaaaaaaaaaaaaaaaaa",
    requestId: "cccccccccccccccccccccccc",
  });
  assert.equal(notification.recipient, "aaaaaaaaaaaaaaaaaaaaaaaa");
  assert.equal(notification.relatedSwapRequest, "cccccccccccccccccccccccc");
  assert.equal(notification.swapDirection, "outgoing");
  assert.equal(notification.title, "Shift swap request sent");
});
