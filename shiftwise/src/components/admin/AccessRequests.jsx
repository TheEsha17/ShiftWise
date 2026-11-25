import { useState } from "react";
import api from "../../api/axios";
import { Pill, Tabs, useAdmin } from "./AdminStore";

const dateLabel = (value) => new Date(value).toLocaleString("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function AccessRequests() {
  const { accessRequests, reload, toast } = useAdmin();
  const [filter, setFilter] = useState("Pending");
  const [busy, setBusy] = useState("");
  const visible = accessRequests.filter((request) => filter === "All" || request.status === filter);

  async function act(request, action) {
    const key = `${request._id}:${action}`;
    setBusy(key);
    try {
      await api.patch(`/access-requests/${request._id}/${action}`);
      await reload();
      toast(action === "approve" ? "Invitation sent. The applicant must set a password before signing in." : action === "reject" ? "Access request rejected." : "A new invitation was sent.");
    } catch (error) {
      toast(error.response?.data?.message || "Could not update this access request.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="access-requests-page">
      <h1>Access Requests</h1>
      <p className="sub">Review new access requests and securely invite approved applicants.</p>
      <div className="cd">
        <div className="hd">
          <h2>{visible.length} request{visible.length === 1 ? "" : "s"}</h2>
          <Tabs opts={["Pending", "Approved", "Rejected", "All"]} cur={filter} on={setFilter} />
        </div>
        {visible.map((request) => (
          <article className="rw access-request-row" key={request._id}>
            <div className="f1">
              <div className="ser">{request.fullName}</div>
              <a className="access-request-email" href={`mailto:${request.email}`}>{request.email}</a>
              <p className="access-request-message">{request.message || "No message provided."}</p>
              <small>Submitted {dateLabel(request.createdAt)}</small>
            </div>
            <div className="ac access-request-actions">
              <div className="access-request-badges">
                <span className="pl">{request.requestedRole}</span>
                <Pill s={request.status} />
              </div>
              {request.status === "Pending" && (
                <div className="access-request-buttons">
                  <button className="access-request-action" disabled={!!busy} onClick={() => act(request, "approve")}>{busy === `${request._id}:approve` ? "Sending…" : "Approve & invite"}</button>
                  <button className="access-request-action access-request-reject" disabled={!!busy} onClick={() => act(request, "reject")}>{busy === `${request._id}:reject` ? "Rejecting…" : "Reject"}</button>
                </div>
              )}
              {request.status === "Approved" && request.invitationPending && (
                <div className="access-request-buttons access-request-buttons-single">
                  <button className="bt o s access-request-action" disabled={!!busy} onClick={() => act(request, "resend")}>{busy === `${request._id}:resend` ? "Sending…" : "Resend invite"}</button>
                </div>
              )}
            </div>
          </article>
        ))}
        {!visible.length && <p className="mut">No {filter.toLowerCase()} access requests.</p>}
      </div>
    </section>
  );
}
