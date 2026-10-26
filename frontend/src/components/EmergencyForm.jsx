import { useCallback, useEffect, useRef, useState } from "react";
import {
  createEmergency,
  uploadEmergencyEvidence,
} from "../services/emergencyService";
import "./EmergencyForm.css";

const ERROR_MESSAGES = {
  NotAllowedError:
    "Camera permission was denied. Allow camera access in your browser settings, or send the alert without a photo.",
  PermissionDeniedError:
    "Camera permission was denied. Allow camera access in your browser settings, or send the alert without a photo.",
  NotFoundError:
    "No camera is available. You can still send the emergency alert without a photo.",
  DevicesNotFoundError:
    "No camera is available. You can still send the emergency alert without a photo.",
  NotReadableError:
    "The camera may be in use by another app. Close it, retry, or send without a photo.",
  OverconstrainedError:
    "The requested camera is unavailable. Retry or send without a photo.",
};

function getEmergencyId(result) {
  return (
    result?.data?.emergency?._id ||
    result?.data?.emergency?.id ||
    result?.emergency?._id ||
    result?.emergency?.id ||
    result?.data?._id ||
    result?.data?.id ||
    result?._id ||
    result?.id ||
    null
  );
}

export default function EmergencyForm() {
  const [stage, setStage] = useState("idle");
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [evidenceError, setEvidenceError] = useState("");
  const [retryingEvidence, setRetryingEvidence] = useState(false);
  const [emergencyId, setEmergencyId] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const sessionRef = useRef(0);
  const cameraRequestSessionRef = useRef(-1);
  const emergencyIdRef = useRef("");
  const photoRef = useRef(null);
  const submittingRef = useRef(false);
  const mountedRef = useRef(true);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraLoading(false);
    setCameraReady(false);
  }, []);

  const stopCameraWithoutState = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const handlePageLeave = () => {
      sessionRef.current += 1;
      stopCamera();
    };
    window.addEventListener("pagehide", handlePageLeave);
    window.addEventListener("beforeunload", handlePageLeave);

    return () => {
      mountedRef.current = false;
      sessionRef.current += 1;
      stopCameraWithoutState();
      window.removeEventListener("pagehide", handlePageLeave);
      window.removeEventListener("beforeunload", handlePageLeave);
    };
  }, [stopCamera, stopCameraWithoutState]);

  useEffect(() => {
    if (stage !== "capturing" || !streamRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const stream = streamRef.current;
    const markReady = () => {
      if (video.videoWidth && video.videoHeight) setCameraReady(true);
    };

    video.srcObject = stream;
    video.addEventListener("loadedmetadata", markReady);
    video.play().then(markReady).catch(() => {
      stopCamera();
      setCameraError("The camera preview could not start. Retry or send without a photo.");
    });
    markReady();

    return () => video.removeEventListener("loadedmetadata", markReady);
  }, [stage, cameraLoading, stopCamera]);

  const requestLocation = useCallback((sessionId) => {
    if (!navigator.geolocation) {
      setLocationError("Location is not supported by this browser.");
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!mountedRef.current || sessionId !== sessionRef.current) return;
        setLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        setLocationLoading(false);
      },
      (error) => {
        if (!mountedRef.current || sessionId !== sessionRef.current) return;
        const messages = {
          1: "Location permission was denied. Allow location access and retry to send the alert.",
          2: "Your device could not determine your location. Check location services and retry.",
          3: "Location detection timed out. Check your connection or device location settings and retry.",
        };
        setLocationError(
          messages[error.code] || "Unable to determine your location. Please retry."
        );
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, []);

  const startCamera = useCallback(async (sessionId) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is unavailable in this browser. Use a supported browser over HTTPS, or send without a photo."
      );
      return;
    }
    if (cameraRequestSessionRef.current === sessionId) return;

    cameraRequestSessionRef.current = sessionId;
    setCameraLoading(true);
    setCameraError("");
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (error) {
        if (error.name !== "OverconstrainedError") throw error;
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (!mountedRef.current || sessionId !== sessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
    } catch (error) {
      if (!mountedRef.current || sessionId !== sessionRef.current) return;
      setCameraError(
        ERROR_MESSAGES[error.name] ||
          "Unable to start the camera. Retry or send the alert without a photo."
      );
    } finally {
      if (cameraRequestSessionRef.current === sessionId) {
        cameraRequestSessionRef.current = -1;
        if (mountedRef.current && sessionId === sessionRef.current) {
          setCameraLoading(false);
        }
      }
    }
  }, []);

  const beginEmergency = () => {
    if (stage !== "idle") return;
    const sessionId = ++sessionRef.current;
    setStage("capturing");
    setLocation(null);
    setLocationError("");
    setCameraError("");
    setRequestError("");
    setEvidenceError("");
    requestLocation(sessionId);
    startCamera(sessionId);
  };

  const retryLocation = () => requestLocation(sessionRef.current);

  const retryCamera = () => {
    setCameraError("");
    startCamera(sessionRef.current);
  };

  const submitEmergency = async (photo) => {
    if (submittingRef.current || stage === "sending" || stage === "submitted") return;
    if (!location) {
      setRequestError("A location is required to send this alert. Please retry location access.");
      return;
    }

    submittingRef.current = true;
    sessionRef.current += 1;
    setStage("sending");
    setRequestError("");
    setEvidenceError("");
    photoRef.current = photo;
    stopCamera();

    try {
      const result = await createEmergency({
        type: "other",
        description: "Emergency alert sent by employee.",
        location,
      });
      const createdId = getEmergencyId(result);
      if (!createdId) {
        throw new Error("The emergency response did not include an alert ID.");
      }

      emergencyIdRef.current = createdId;
      setEmergencyId(createdId);

      if (photo) {
        try {
          await uploadEmergencyEvidence(createdId, [photo]);
        } catch (error) {
          setEvidenceError(
            error?.response?.data?.message ||
              "The emergency was sent, but the photo could not be attached. Retry the photo upload below."
          );
        }
      }

      setStage("submitted");
    } catch (error) {
      setRequestError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to send the emergency alert. Please try again."
      );
      setCameraError(
        "The alert was not sent and the camera has stopped. Retry the camera or send without a photo."
      );
      setStage("capturing");
    } finally {
      submittingRef.current = false;
    }
  };

  const captureAndSend = () => {
    const sessionId = sessionRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!video || !canvas || !context || !cameraReady) {
      setCameraError("The camera is not ready. Retry the camera or send without a photo.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!mountedRef.current || sessionId !== sessionRef.current) return;
        if (!blob) {
          setCameraError("Could not capture a photo. Retry or send without a photo.");
          return;
        }
        const photo = new File([blob], `emergency-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        submitEmergency(photo);
      },
      "image/jpeg",
      0.85
    );
  };

  const retryPhotoUpload = async () => {
    if (retryingEvidence || !emergencyIdRef.current || !photoRef.current) return;
    setRetryingEvidence(true);
    setEvidenceError("");
    try {
      await uploadEmergencyEvidence(emergencyIdRef.current, [photoRef.current]);
    } catch (error) {
      setEvidenceError(
        error?.response?.data?.message ||
          "Photo upload failed. Check your connection and retry."
      );
    } finally {
      setRetryingEvidence(false);
    }
  };

  const cancelEmergency = () => {
    sessionRef.current += 1;
    stopCamera();
    setStage("idle");
    setLocation(null);
    setLocationError("");
    setRequestError("");
    setCameraError("");
    setEmergencyId("");
    emergencyIdRef.current = "";
    photoRef.current = null;
  };

  return (
    <div className="emergency-one-tap-card">
      {requestError && <div className="emergency-message error" role="alert">{requestError}</div>}

      {stage === "idle" && (
        <div className="emergency-start-panel">
          <button
            className="emergency-start-button"
            type="button"
            aria-label="Emergency"
            onClick={beginEmergency}
          >
            Emergency
          </button>
        </div>
      )}

      {(stage === "capturing" || stage === "sending") && (
        <div className="emergency-one-tap-session">
          <div className="emergency-one-tap-status" aria-live="polite">
            {locationLoading && <span>Getting your location…</span>}
            {location && <span>Location ready</span>}
            {locationError && (
              <span className="emergency-one-tap-error">
                {locationError}{" "}
                <button type="button" className="emergency-one-tap-text-button" onClick={retryLocation}>
                  Retry location
                </button>
              </span>
            )}
          </div>

          <div className="emergency-one-tap-camera">
            {cameraLoading && <p className="emergency-one-tap-camera-message">Starting camera…</p>}
            {!cameraLoading && !cameraError && (
              <video ref={videoRef} autoPlay playsInline muted aria-label="Live camera preview" />
            )}
            {cameraError && <p className="emergency-one-tap-camera-message" role="status">{cameraError}</p>}
          </div>

          <canvas ref={canvasRef} hidden />

          {stage === "sending" ? (
            <p className="emergency-one-tap-sending" role="status">Sending emergency alert…</p>
          ) : (
            <div className="emergency-one-tap-actions">
              {cameraError ? (
                <button type="button" className="emergency-one-tap-secondary" onClick={retryCamera}>
                  Retry camera
                </button>
              ) : (
                <button
                  type="button"
                  className="emergency-one-tap-button"
                  disabled={!cameraReady || !location}
                  onClick={captureAndSend}
                >
                  Capture &amp; Send Alert
                </button>
              )}
              <button
                type="button"
                className="emergency-one-tap-secondary"
                disabled={!location}
                onClick={() => submitEmergency(null)}
              >
                Send Without Photo
              </button>
              <button type="button" className="emergency-one-tap-text-button" onClick={cancelEmergency}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {stage === "submitted" && (
        <div className="emergency-one-tap-complete" role="status">
          <h3>Emergency alert recorded</h3>
          <p>Your alert is available to your company response team. Track it under My Emergencies. Alert ID: {emergencyId}</p>
          {evidenceError && (
            <div className="emergency-message error" role="alert">
              {evidenceError}{" "}
              <button type="button" className="emergency-one-tap-text-button" disabled={retryingEvidence} onClick={retryPhotoUpload}>
                {retryingEvidence ? "Retrying…" : "Retry photo upload"}
              </button>
            </div>
          )}
          <button type="button" className="emergency-one-tap-secondary" onClick={cancelEmergency}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
