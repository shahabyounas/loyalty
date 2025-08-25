import React, { useState, useRef } from "react";
import { stampTransactionAPI } from "../../utils/api";
import "./StaffScanner.css";

const StaffScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleScan = async (qrData) => {
    if (!storeId) {
      setError("Please select a store first");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Parse QR data
      let parsedData;
      try {
        parsedData = typeof qrData === "string" ? JSON.parse(qrData) : qrData;
      } catch (parseError) {
        setError("Invalid QR code format");
        setLoading(false);
        return;
      }

      // Check if QR code is expired
      const expiresAt = new Date(parsedData.expires_at);
      if (expiresAt < new Date()) {
        setError(
          "QR code has expired. Please ask customer to generate a new one."
        );
        setLoading(false);
        return;
      }

      // Create transaction and add stamp in one API call
      const response = await stampTransactionAPI.scanTransaction(
        parsedData.code || parsedData.transaction_code,
        parseInt(storeId),
        {
          user_id: parsedData.user_id,
          reward_id: parsedData.reward_id,
          expires_at: parsedData.expires_at,
        }
      );

      if (response.success) {
        setSuccess(response.message);
        setScanResult(response.data);

        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setSuccess("");
          setScanResult(null);
        }, 5000);
      } else {
        setError(response.message || "Failed to scan transaction");
      }
    } catch (error) {
      console.error("Scan error:", error);
      setError("Failed to scan transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      // For manual entry, we expect the full QR data JSON
      handleScan(manualCode.trim());
      setManualCode("");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanning(true);
    } catch (error) {
      console.error("Camera error:", error);
      setError("Failed to access camera. Please use manual entry.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleQRCodeDetected = (result) => {
    if (result && result.data) {
      try {
        const qrData = JSON.parse(result.data);
        if (qrData.code) {
          handleScan(qrData.code);
        }
      } catch (error) {
        console.error("Invalid QR code data:", error);
        setError("Invalid QR code format");
      }
    }
  };

  return (
    <div className="staff-scanner-container">
      <div className="staff-scanner-header">
        <h2 className="staff-scanner-title">📱 Staff QR Scanner</h2>
        <p className="staff-scanner-subtitle">
          Scan customer QR codes to add stamps to their rewards
        </p>
      </div>

      <div className="staff-scanner-content">
        {/* Store Selection */}
        <div className="staff-store-selection">
          <label className="staff-store-label">Select Store:</label>
          <select
            className="staff-store-select"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
          >
            <option value="">Choose a store...</option>
            <option value="1">Store 1 - Downtown</option>
            <option value="2">Store 2 - Mall</option>
            <option value="3">Store 3 - Airport</option>
          </select>
        </div>

        {/* Scanner Tabs */}
        <div className="staff-scanner-tabs">
          <button
            className={`staff-tab ${!scanning ? "staff-tab-active" : ""}`}
            onClick={stopCamera}
          >
            📝 Manual Entry
          </button>
          <button
            className={`staff-tab ${scanning ? "staff-tab-active" : ""}`}
            onClick={startCamera}
          >
            📷 Camera Scanner
          </button>
        </div>

        {/* Manual Entry */}
        {!scanning && (
          <div className="staff-manual-entry">
            <form onSubmit={handleManualSubmit} className="staff-manual-form">
              <div className="staff-input-group">
                <label className="staff-input-label">QR Code Data:</label>
                <textarea
                  className="staff-input"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Paste the QR code JSON data here..."
                  rows="3"
                  required
                />
              </div>
              <button
                type="submit"
                className="staff-scan-button"
                disabled={loading || !storeId}
              >
                {loading ? "Scanning..." : "Scan Transaction"}
              </button>
            </form>
          </div>
        )}

        {/* Camera Scanner */}
        {scanning && (
          <div className="staff-camera-scanner">
            <div className="staff-camera-container">
              <video
                ref={videoRef}
                className="staff-camera-video"
                autoPlay
                playsInline
                muted
              />
              <div className="staff-camera-overlay">
                <div className="staff-camera-frame"></div>
                <div className="staff-camera-instruction">
                  Position QR code within the frame
                </div>
              </div>
            </div>
            <button className="staff-stop-camera-button" onClick={stopCamera}>
              Stop Camera
            </button>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="staff-message staff-error">
            <span className="staff-message-icon">❌</span>
            <span className="staff-message-text">{error}</span>
          </div>
        )}

        {success && (
          <div className="staff-message staff-success">
            <span className="staff-message-icon">✅</span>
            <span className="staff-message-text">{success}</span>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className="staff-scan-result">
            <h3 className="staff-result-title">Scan Result</h3>
            <div className="staff-result-details">
              <div className="staff-result-item">
                <span className="staff-result-label">Customer:</span>
                <span className="staff-result-value">
                  {scanResult.user_name}
                </span>
              </div>
              <div className="staff-result-item">
                <span className="staff-result-label">Reward:</span>
                <span className="staff-result-value">
                  {scanResult.reward_name}
                </span>
              </div>
              <div className="staff-result-item">
                <span className="staff-result-label">Progress:</span>
                <span className="staff-result-value">
                  {scanResult.stamps_collected}/{scanResult.stamps_required}
                </span>
              </div>
              <div className="staff-result-item">
                <span className="staff-result-label">Status:</span>
                <span
                  className={`staff-result-value ${
                    scanResult.is_completed
                      ? "staff-completed"
                      : "staff-in-progress"
                  }`}
                >
                  {scanResult.is_completed ? "🎉 Completed!" : "In Progress"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="staff-instructions">
          <h4 className="staff-instructions-title">How to use:</h4>
          <div className="staff-instruction-steps">
            <div className="staff-instruction-step">
              <span className="staff-step-number">1</span>
              <span className="staff-step-text">
                Select your store location
              </span>
            </div>
            <div className="staff-instruction-step">
              <span className="staff-step-number">2</span>
              <span className="staff-step-text">
                Choose manual entry or camera scanner
              </span>
            </div>
            <div className="staff-instruction-step">
              <span className="staff-step-number">3</span>
              <span className="staff-step-text">
                Scan customer's QR code or paste QR data manually
              </span>
            </div>
            <div className="staff-instruction-step">
              <span className="staff-step-number">4</span>
              <span className="staff-step-text">
                Confirm the stamp has been added
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffScanner;
