const incomingSwapNotification = ({ recipient, requestId, requesterName }) => ({
  recipient,
  title: "Incoming shift swap request",
  message: `${requesterName} requested to swap a shift with you.`,
  type: "Request",
  relatedSwapRequest: requestId,
  swapDirection: "incoming",
});

const outgoingSwapRequestNotification = ({ recipient, requestId }) => ({
  recipient,
  title: "Shift swap request sent",
  message: "Your shift swap request was sent and is waiting for a response.",
  type: "Request",
  relatedSwapRequest: requestId,
  swapDirection: "outgoing",
});

const outgoingSwapNotification = ({ recipient, requestId, responderName, status }) => ({
  recipient,
  title: `Shift swap ${status.toLowerCase()}`,
  message: status === "Accepted"
    ? `${responderName} accepted your request and the shifts were exchanged.`
    : `${responderName} declined your shift swap request.`,
  type: "Request",
  relatedSwapRequest: requestId,
  swapDirection: "outgoing",
});

module.exports = { incomingSwapNotification, outgoingSwapRequestNotification, outgoingSwapNotification };
