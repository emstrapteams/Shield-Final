
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createEmergency,
  uploadEmergencyEvidence,
} from "../services/emergencyService";
import "./EmergencyForm.css";

const MAX_EVIDENCE = 5;

const EmergencyForm = () => {
  const [emergencyType, setEmergencyType] = useState("");
  const [description, setDescription] = useState("");

  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [emergencyId, setEmergencyId] = useState(null);
  const [uploadedAdditionalCount, setUploadedAdditionalCount] = useState(0);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRequestRef = useRef(false);
  const createdEmergencyIdRef = useRef(null);
  const locationRequestRef = useRef(false);
  const photoPreviewRef = useRef("");

  // Attach an active camera stream whenever the video element is mounted.
  const attachVideoStream = useCallback(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    video.play().catch((playError) => {
      console.warn("Camera preview could not autoplay:", playError);
    });
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    cameraRequestRef.current = false;
    setCameraReady(false);
    setCameraLoading(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (cameraRequestRef.current || streamRef.current) {
      attachVideoStream();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is unavailable. Use HTTPS or localhost and a supported browser."
      );
      return;
    }

    cameraRequestRef.current = true;
    setCameraLoading(true);
    setCameraReady(false);
    setCameraError("");
    setError("");

    try {
      let stream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });
      } catch (firstError) {
        // Some desktop webcams do not support the requested facing mode.
        if (
          firstError.name === "OverconstrainedError" ||
          firstError.name === "NotFoundError"
        ) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw firstError;
        }
      }

      // Stop a newly acquired stream if the request was cancelled/unmounted.
      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        // The video element may mount shortly afterwards.
        return;
      }

      video.srcObject = stream;

      await new Promise((resolve, reject) => {
        if (video.readyState >= 1) {
          resolve();
          return;
        }

        const onLoaded = () => {
          cleanup();
          resolve();
        };

        const onError = () => {
          cleanup();
          reject(new Error("The camera preview could not be initialized."));
        };

        const cleanup = () => {
          video.removeEventListener("loadedmetadata", onLoaded);
          video.removeEventListener("error", onError);
        };

        video.addEventListener("loadedmetadata", onLoaded, { once: true });
        video.addEventListener("error", onError, { once: true });

        // Handle metadata that arrives while listeners are being attached.
        if (video.readyState >= 1) {
          cleanup();
          resolve();
        }
      });

      await video.play();
      setCameraReady(Boolean(video.videoWidth && video.videoHeight));
    } catch (cameraError) {
      console.error("Camera access failed:", cameraError);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      let message =
        "Unable to start the camera. Allow camera permission and try again.";

      if (
        cameraError.name === "NotAllowedError" ||
        cameraError.name === "PermissionDeniedError"
      ) {
        message =
          "Camera permission was denied. Allow camera access for localhost in your browser settings, then click Start Camera.";
      } else if (
        cameraError.name === "NotFoundError" ||
        cameraError.name === "DevicesNotFoundError"
      ) {
        message =
          "No webcam was found. Connect a camera and try again.";
      } else if (
        cameraError.name === "NotReadableError" ||
        cameraError.name === "TrackStartError"
      ) {
        message =
          "The webcam may be in use by another application. Close other apps using it and try again.";
      }

      setCameraError(message);
    } finally {
      cameraRequestRef.current = false;
      setCameraLoading(false);
    }
  }, [attachVideoStream]);

  // Request GPS location automatically when the form opens.
const captureLocation = useCallback(() => {
  if (!navigator.geolocation) {
    setLocationError(
      "Location is not supported by this browser."
    );
    setLocationLoading(false);
    return;
  }

  setLocationLoading(true);
  setLocationError("");

  const handleSuccess = (position) => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    });

    setLocationLoading(false);
    setLocationError("");
  };

  const handleFailure = (geoError) => {
    console.error("GPS detection failed:", geoError);

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (retryError) => {
        console.error("GPS retry failed:", retryError);

        let message =
          "Unable to determine your location. Check your browser permissions and device location settings.";

        if (retryError.code === 1) {
          message =
            "Location permission denied. Allow location access for localhost in Chrome site settings.";
        } else if (retryError.code === 2) {
          message =
            "Your device could not determine your location. Check Windows Location Services and your network.";
        } else if (retryError.code === 3) {
          message =
            "Location detection timed out. Check Windows Location Services and your Wi-Fi/network, then retry.";
        }

        setLocationError(message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );
  };

  navigator.geolocation.getCurrentPosition(
    handleSuccess,
    handleFailure,
    {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 60000,
    }
  );
}, []);
  useEffect(() => {
    startCamera();

    if (!locationRequestRef.current) {
      locationRequestRef.current = true;
      captureLocation();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      cameraRequestRef.current = false;
    };
  }, [startCamera, captureLocation]);

  // If the video element appears after getUserMedia resolves, attach the stream.
  useEffect(() => {
    attachVideoStream();
  }, [capturedPhoto, attachVideoStream]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !streamRef.current) {
      setCameraError("The camera is not ready. Click Start Camera and try again.");
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError("The camera is still starting. Please try again shortly.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Unable to capture the photo. Please try again.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Unable to capture the photo. Please try again.");
          return;
        }

        const photoFile = new File(
          [blob],
          `emergency-photo-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );

        const previewUrl = URL.createObjectURL(photoFile);

        if (photoPreviewRef.current) {
          URL.revokeObjectURL(photoPreviewRef.current);
        }

        photoPreviewRef.current = previewUrl;
        setCapturedPhoto(photoFile);
        setPhotoPreview(previewUrl);
        setCameraError("");
        setError("");
        setSuccessMessage("");

        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  const retakePhoto = async () => {
    if (photoPreviewRef.current) {
      URL.revokeObjectURL(photoPreviewRef.current);
      photoPreviewRef.current = "";
    }

    setCapturedPhoto(null);
    setPhotoPreview("");
    setCameraError("");
    setError("");
    setSuccessMessage("");

    await startCamera();
  };

  const getCreatedEmergencyId = (result) => {
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!emergencyType) {
      setError("Please select an emergency type.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the emergency.");
      return;
    }

    if (!capturedPhoto) {
      setError("Please capture the required live photo.");
      return;
    }

    if (!location) {
      setError(
        "Your GPS location is required. Please detect your location before submitting."
      );
      return;
    }

    setSubmitting(true);

    try {
      let id = createdEmergencyIdRef.current;

      if (!id) {
        const payload = {
          emergencyType,
          description: description.trim(),
          latitude: location.latitude,
          longitude: location.longitude,
        };

        const result = await createEmergency(payload);
        id = getCreatedEmergencyId(result);

        if (!id) {
          throw new Error(
            "The emergency was created, but its ID could not be identified. Check the API response before retrying."
          );
        }

        createdEmergencyIdRef.current = id;
        setEmergencyId(id);
      }

      // Upload the one required live photo.
      await uploadEmergencyEvidence(id, capturedPhoto);

      setEmergencyId(id);
      setSubmitted(true);
      setSuccessMessage(
        "Emergency submitted successfully. You can add more evidence below if needed."
      );

      stopCamera();
    } catch (submitError) {
      console.error("Emergency submission failed:", submitError);

      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to submit the emergency. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdditionalFileSelection = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    const remainingSlots = MAX_EVIDENCE - 1 - uploadedAdditionalCount;

    if (remainingSlots <= 0) {
      setError("You have reached the maximum of 5 evidence files.");
      return;
    }

    const acceptedFiles = selectedFiles.filter((file) =>
      ["image/", "video/"].some((type) => file.type.startsWith(type))
    );

    if (acceptedFiles.length !== selectedFiles.length) {
      setError("Only image and video evidence files are allowed.");
    } else {
      setError("");
    }

    const filesToAdd = acceptedFiles.slice(0, remainingSlots);

    if (acceptedFiles.length > remainingSlots) {
      setError(
        `You can add only ${remainingSlots} more evidence file(s). The maximum is 5 files in total.`
      );
    }

    setAdditionalFiles((previous) =>
      [...previous, ...filesToAdd].slice(0, remainingSlots)
    );
  };

  const removeAdditionalFile = (indexToRemove) => {
    setAdditionalFiles((previous) =>
      previous.filter((_, index) => index !== indexToRemove)
    );
  };

  const uploadAdditionalEvidence = async () => {
    if (!emergencyId) {
      setError("The emergency ID is missing. Please check the submission.");
      return;
    }

    if (additionalFiles.length === 0) {
      setError("Please select at least one additional evidence file.");
      return;
    }

    const remainingSlots = MAX_EVIDENCE - 1 - uploadedAdditionalCount;

    if (additionalFiles.length > remainingSlots) {
      setError(`You can upload only ${remainingSlots} more evidence file(s).`);
      return;
    }

    setUploadingAdditional(true);
    setError("");
    setSuccessMessage("");

    let successfulUploads = 0;
    const failedFiles = [];

    for (const file of additionalFiles) {
      try {
        await uploadEmergencyEvidence(emergencyId, file);
        successfulUploads += 1;
      } catch (uploadError) {
        console.error(`Evidence upload failed for ${file.name}:`, uploadError);
        failedFiles.push(file);
      }
    }

    setUploadedAdditionalCount((count) => count + successfulUploads);
    setAdditionalFiles(failedFiles);
    setUploadingAdditional(false);

    if (successfulUploads > 0 && failedFiles.length === 0) {
      setSuccessMessage(
        `${successfulUploads} additional evidence file(s) uploaded successfully.`
      );
    } else if (successfulUploads > 0) {
      setSuccessMessage(
        `${successfulUploads} file(s) uploaded. ${failedFiles.length} file(s) failed and remain selected for retry.`
      );
      setError("Some files could not be uploaded. Please retry the remaining files.");
    } else {
      setError(
        "Additional evidence could not be uploaded. Please check your connection and try again."
      );
    }
  };

  const evidenceCount = 1 + uploadedAdditionalCount;
  const remainingEvidenceSlots = MAX_EVIDENCE - evidenceCount;

  useEffect(() => {
    return () => {
      if (photoPreviewRef.current) {
        URL.revokeObjectURL(photoPreviewRef.current);
        photoPreviewRef.current = "";
      }
    };
  }, []);

  if (submitted) {
    return (
      <div className="emergency-form-card">
        <h2 className="emergency-form-heading">Emergency Submitted</h2>

        {successMessage && (
          <div className="emergency-message success" role="status">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="emergency-message error" role="alert">
            {error}
          </div>
        )}

        <section className="additional-evidence-section">
          <h3>Additional Evidence (Optional)</h3>

          <p>
            Your emergency and required live photo have been submitted. You
            can upload additional photos or videos if necessary.
          </p>

          <p>
            Evidence files: <strong>{evidenceCount}</strong> / {MAX_EVIDENCE}
          </p>

          {remainingEvidenceSlots > 0 ? (
            <>
              <div className="emergency-field">
                <label htmlFor="additionalEvidence">
                  Select additional photos or videos
                </label>

                <input
                  id="additionalEvidence"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleAdditionalFileSelection}
                  disabled={uploadingAdditional}
                />

                <p className="emergency-field-hint">
                  You can upload {remainingEvidenceSlots} more file(s).
                </p>
              </div>

              {additionalFiles.length > 0 && (
                <div>
                  <h4>Files selected for upload</h4>

                  {additionalFiles.map((file, index) => (
                    <div
                      className="emergency-file-item"
                      key={`${file.name}-${file.size}-${index}`}
                    >
                      <span>
                        {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>

                      <button
                        type="button"
                        onClick={() => removeAdditionalFile(index)}
                        disabled={uploadingAdditional}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="additional-upload-button"
                    onClick={uploadAdditionalEvidence}
                    disabled={uploadingAdditional}
                  >
                    {uploadingAdditional
                      ? "Uploading Evidence..."
                      : "Upload Additional Evidence"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="evidence-limit-message">
              You have reached the maximum of 5 evidence files.
            </p>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="emergency-form-card">
      <h2 className="emergency-form-heading">Report an Emergency</h2>

      <p>
        Provide the emergency details, capture one live photo, and allow
        location access so responders can locate the incident.
      </p>

      {error && (
        <div className="emergency-message error" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="emergency-message success" role="status">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <section className="visual-context-section">
          <h3>
            Live Photo <span className="emergency-required">*</span>
          </h3>

          <p className="required-photo-note">
            One live photo is required before submitting the emergency.
          </p>

          {!capturedPhoto ? (
            <div className="patient-photo-card">
              {streamRef.current && (
              <video
                ref={videoRef}
                className="compact-camera-video"
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  const video = videoRef.current;
                  if (video?.videoWidth && video?.videoHeight) {
                    setCameraReady(true);
                  }
                }}
              />
              )}

              {!cameraReady && (
                <p className="compact-camera-message">
                  {cameraLoading
                    ? "Starting camera..."
                    : cameraError || "Camera permission may be required."}
                </p>
              )}

              {cameraError && (
                <p className="emergency-field-hint" role="alert">
                  {cameraError}
                </p>
              )}

              <div className="captured-photo-actions">
                <button
                  type="button"
                  className="compact-capture-button"
                  onClick={capturePhoto}
                  disabled={!cameraReady || cameraLoading}
                >
                  Capture Live Photo
                </button>

                {!cameraReady && (
                  <button
                    type="button"
                    className="compact-capture-button"
                    onClick={startCamera}
                    disabled={cameraLoading}
                  >
                    {cameraLoading ? "Starting Camera..." : "Start Camera"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="patient-photo-card">
              <img
                src={photoPreview}
                alt="Captured emergency evidence"
                className="compact-camera-preview"
              />

              <p className="photo-captured-success">
                Live photo captured successfully.
              </p>

              <button
                type="button"
                className="compact-capture-button"
                onClick={retakePhoto}
                disabled={submitting}
              >
                Retake Photo
              </button>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="camera-canvas"
            aria-hidden="true"
          />
        </section>

        <div className="emergency-field">
          <label htmlFor="emergencyType">
            Emergency Type <span className="emergency-required">*</span>
          </label>

          <select
            id="emergencyType"
            value={emergencyType}
            onChange={(event) => setEmergencyType(event.target.value)}
            required
          >
            <option value="">Select emergency type</option>
            <option value="Medical">Medical Emergency</option>
            <option value="Fire">Fire</option>
            <option value="Accident">Accident</option>
            <option value="Security">Security Threat</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="emergency-field">
          <label htmlFor="description">
            Description <span className="emergency-required">*</span>
          </label>

          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe what happened and any immediate danger..."
            rows={4}
            maxLength={1000}
            required
          />

          <p className="emergency-character-count">
            {description.length}/1000 characters
          </p>
        </div>

        <section className="emergency-field">
          <h3>
            GPS Location <span className="emergency-required">*</span>
          </h3>

          <div className="emergency-location-box">
            {locationLoading ? (
              <p className="location-status">
                Detecting your location automatically. Allow location access
                if your browser asks.
              </p>
            ) : location ? (
              <div className="location-details">
                <p className="location-status">
                  GPS location detected successfully.
                </p>

                <p>
                  <strong>Latitude:</strong> {location.latitude.toFixed(6)}
                </p>

                <p>
                  <strong>Longitude:</strong> {location.longitude.toFixed(6)}
                </p>

                <p>
                  <strong>Accuracy:</strong> {Math.round(location.accuracy)} metres
                </p>
              </div>
            ) : (
              <p className="location-status">
                {locationError || "Detecting your current location..."}
              </p>
            )}

            {locationError && (
              <p className="emergency-field-hint" role="alert">
                {locationError}
              </p>
            )}

            <button
              type="button"
              className="location-button"
              onClick={captureLocation}
              disabled={locationLoading}
            >
              {locationLoading
                ? "Detecting Location..."
                : location
                  ? "Refresh Location"
                  : "Retry GPS Detection"}
            </button>
          </div>
        </section>

        <button
          type="submit"
          className="emergency-submit-button"
          disabled={submitting || locationLoading}
        >
          {submitting ? "Submitting Emergency..." : "Submit Emergency"}
        </button>
      </form>
    </div>
  );
};

export default EmergencyForm;
