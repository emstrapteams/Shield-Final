
import { useCallback, useEffect, useState } from "react";

import {
  getMyEmergencies,
  cancelEmergency,
} from "../services/emergencyService";

import "./EmergencyList.css";

const statusLabels = {
  triggered: "Triggered",
  alert_created: "Alert Created",
  response_in_progress: "Response In Progress",
  resolved: "Resolved",
  closed: "Closed",
  cancelled: "Cancelled",
};

const typeLabels = {
  medical: "Medical Emergency",
  fire: "Fire",
  accident: "Accident",
  electrical: "Electrical Hazard",
  chemical: "Chemical Spill",
  gas: "Gas Leak",
  vehicle: "Vehicle Emergency",
  equipment: "Equipment Failure",
  security: "Security Threat",
  emergency_alert: "Emergency Alert",
  other: "Other",
};

function EmergencyList() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeCancelId, setActiveCancelId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const fetchEmergencies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getMyEmergencies();

      const records =
        result?.data?.emergencies ??
        result?.data ??
        [];

      setEmergencies(
        Array.isArray(records) ? records : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your emergencies. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencies();
  }, [fetchEmergencies]);

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleCancel = async (emergency) => {
    const emergencyId =
      emergency.referenceId ||
      emergency.reference ||
      emergency._id ||
      emergency.id;

    if (!emergencyId) {
      setCancelError("Unable to identify this emergency.");
      return;
    }

    if (cancellationReason.trim().length < 5) {
      setCancelError(
        "Please provide a reason of at least 5 characters."
      );
      return;
    }

    setCancelling(true);
    setCancelError("");

    try {
      await cancelEmergency(
        emergencyId,
        cancellationReason.trim()
      );

      setActiveCancelId(null);
      setCancellationReason("");

      await fetchEmergencies();
    } catch (err) {
      setCancelError(
        err.response?.data?.message ||
          "Unable to cancel this emergency. Please try again."
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="emergency-list-card">
        <p className="emergency-list-message">
          Loading your emergencies...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="emergency-list-card">
        <div className="emergency-list-error" role="alert">
          {error}
        </div>

        <button
          className="emergency-refresh-button"
          onClick={fetchEmergencies}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="emergency-list-card">
      <div className="emergency-list-heading">
        <div>
          <h2>My Emergency Reports</h2>
          <p>
            View the emergencies you have submitted.
          </p>
        </div>

        <button
          className="emergency-refresh-button"
          onClick={fetchEmergencies}
        >
          Refresh
        </button>
      </div>

      {emergencies.length === 0 ? (
        <div className="emergency-empty-state">
          <h3>No emergencies reported yet</h3>
          <p>
            Any emergency you submit will appear here.
          </p>
        </div>
      ) : (
        <div className="emergency-records">
          {emergencies.map((emergency) => {
            const emergencyId =
              emergency.referenceId ||
              emergency.reference ||
              emergency._id ||
              emergency.id;

            const recordKey =
              emergency._id ||
              emergency.id ||
              emergencyId;

            return (
              <article
                className="emergency-record"
                key={recordKey}
              >
                <div className="emergency-record-top">
                  <div>
                    <h3>
                      {typeLabels[emergency.type] ||
                        emergency.type}
                    </h3>

                    <span className="emergency-record-date">
                      {formatDate(emergency.createdAt)}
                    </span>
                  </div>

                  <span
                    className={`emergency-status status-${emergency.status}`}
                  >
                    {statusLabels[emergency.status] ||
                      emergency.status}
                  </span>
                </div>

                <p className="emergency-record-description">
                  {emergency.description}
                </p>

                {emergency.location && (
                  <div className="emergency-record-location">
                    <strong>Reported Location:</strong>{" "}
                    {emergency.location.latitude},{" "}
                    {emergency.location.longitude}
                  </div>
                )}

                {emergency.evidence?.length > 0 && (
                  <div className="emergency-record-evidence">
                    <strong>Attached Evidence</strong>

                    <div className="evidence-gallery">
                      {emergency.evidence.map((file, index) => (
                        <div
                          className="evidence-item"
                          key={file.publicId || index}
                        >
                          {file.mediaType === "video" ? (
                            <video
                              src={file.url}
                              controls
                              preload="metadata"
                              className="evidence-media"
                            >
                              Your browser does not support video playback.
                            </video>
                          ) : (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View evidence ${index + 1}`}
                            >
                              <img
                                src={file.url}
                                alt={`Emergency evidence ${index + 1}`}
                                className="evidence-media"
                                loading="lazy"
                              />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="emergency-record-id">
                  Reference: {emergencyId}
                </div>

                {emergency.status === "triggered" && (
                  <div className="emergency-cancel-section">
                    {activeCancelId === recordKey ? (
                      <div className="emergency-cancel-form">
                        <h4>Cancel Emergency</h4>

                        <p>
                          Please explain why you are cancelling
                          this emergency report.
                        </p>

                        <textarea
                          value={cancellationReason}
                          onChange={(e) => {
                            setCancellationReason(e.target.value);
                            setCancelError("");
                          }}
                          placeholder="Enter cancellation reason..."
                          rows={3}
                          maxLength={500}
                          disabled={cancelling}
                        />

                        <div className="emergency-cancel-actions">
                          <button
                            type="button"
                            className="emergency-cancel-confirm"
                            onClick={() => handleCancel(emergency)}
                            disabled={cancelling}
                          >
                            {cancelling
                              ? "Cancelling..."
                              : "Confirm Cancellation"}
                          </button>

                          <button
                            type="button"
                            className="emergency-cancel-back"
                            onClick={() => {
                              setActiveCancelId(null);
                              setCancellationReason("");
                              setCancelError("");
                            }}
                            disabled={cancelling}
                          >
                            Go Back
                          </button>
                        </div>

                        {cancelError && (
                          <p
                            className="emergency-cancel-error"
                            role="alert"
                          >
                            {cancelError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="emergency-cancel-button"
                        onClick={() => {
                          setActiveCancelId(recordKey);
                          setCancellationReason("");
                          setCancelError("");
                        }}
                      >
                        Cancel Emergency
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default EmergencyList;