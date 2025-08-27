import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { stampTransactionAPI } from "../../utils/api";
import { Scanner } from "@yudiel/react-qr-scanner";
import "./QRCodeScanner.css";

const QRCodeScanner = () => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const startScanning = () => {
    setIsScanning(true);
    setScannedData(null);
    setScanResult(null);
    setError(null);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const handleScan = async (data) => {
    console.log("QR Code detected:", data);
    if (!data || isProcessing) return;

    try {
      setIsProcessing(true);
      setScannedData(data);

      // Parse the QR code data
      const qrData = JSON.parse(data);

      // Validate QR code data structure
      if (!qrData.user_id || !qrData.reward_id) {
        throw new Error("Invalid QR code format");
      }

      // Process the stamp transaction
      const response = await stampTransactionAPI.processScan({
        user_id: qrData.user_id,
        reward_id: qrData.reward_id,
        scanned_by: user.id,
        store_id: user.store_id || null,
      });

      setScanResult({
        success: true,
        message: "Stamp added successfully!",
        data: response.data,
      });

      // Stop scanning after successful scan
      setTimeout(() => {
        stopScanning();
      }, 2000);
    } catch (err) {
      console.error("Error processing scan:", err);
      setScanResult({
        success: false,
        message: err.message || "Failed to process scan",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualInput = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const qrCode = formData.get("qrCode").trim();

    if (!qrCode) {
      setError("Please enter a QR code");
      return;
    }

    await handleScan(qrCode);
  };

  const resetScanner = () => {
    setScannedData(null);
    setScanResult(null);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div className="qr-scanner-container">
      <div className="qr-scanner-header">
        <h2 className="qr-scanner-title">
          <span className="qr-scanner-icon">📱</span>
          QR Code Scanner
        </h2>
        <p className="qr-scanner-subtitle">
          Scan customer QR codes to add stamps to their rewards
        </p>
      </div>

      {!isScanning && !scannedData && (
        <div className="qr-scanner-setup">
          <div className="qr-scanner-instructions">
            <h3>How to use:</h3>
            <ol>
              <li>Customer opens their loyalty app</li>
              <li>They select a reward and generate a QR code</li>
              <li>Customer shows the QR code to you</li>
              <li>Click "Start Scanning" and scan the QR code</li>
              <li>The stamp will be automatically added to their reward</li>
            </ol>
          </div>

          <div className="qr-scanner-actions">
            <button className="qr-scanner-start-btn" onClick={startScanning}>
              📱 Start Scanning
            </button>

            <div className="qr-scanner-divider">
              <span>or</span>
            </div>

            <form
              onSubmit={handleManualInput}
              className="qr-scanner-manual-form"
            >
              <input
                type="text"
                name="qrCode"
                placeholder="Enter QR code manually..."
                className="qr-scanner-manual-input"
                disabled={isProcessing}
              />
              <button
                type="submit"
                className="qr-scanner-manual-btn"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="qr-scanner-camera">
          <div className="qr-scanner-video-container">
            <Scanner
              onScan={(result) => {
                console.log("Scanner result:", result);
                if (result && result[0] && result[0].rawValue) {
                  handleScan(result[0].rawValue);
                  setIsScanning(false);
                }
              }}
              onError={(error) => {
                console.log("Scanner error:", error);
                setError("Camera access error. Please check permissions.");
              }}
            />
          </div>

          <div className="qr-scanner-camera-controls">
            <button className="qr-scanner-stop-btn" onClick={stopScanning}>
              ⏹️ Stop Scanning
            </button>
          </div>

          {error && (
            <div className="qr-scanner-error">
              <span className="qr-scanner-error-icon">⚠️</span>
              {error}
            </div>
          )}
        </div>
      )}

      {scannedData && (
        <div className="qr-scanner-result">
          <div className="qr-scanner-result-header">
            <h3>Scan Result</h3>
            <button className="qr-scanner-reset-btn" onClick={resetScanner}>
              🔄 Scan Another
            </button>
          </div>

          <div className="qr-scanner-result-content">
            {scanResult?.success ? (
              <div className="qr-scanner-success">
                <div className="qr-scanner-success-icon">✅</div>
                <h4>Success!</h4>
                <p>{scanResult.message}</p>
                {scanResult.data && (
                  <div className="qr-scanner-result-details">
                    <p>
                      <strong>Customer:</strong> {scanResult.data.customer_name}
                    </p>
                    <p>
                      <strong>Reward:</strong> {scanResult.data.reward_name}
                    </p>
                    <p>
                      <strong>Stamps:</strong>{" "}
                      {scanResult.data.stamps_collected}/
                      {scanResult.data.stamps_required}
                    </p>
                    <p>
                      <strong>Progress:</strong>{" "}
                      {Math.round(
                        (scanResult.data.stamps_collected /
                          scanResult.data.stamps_required) *
                          100
                      )}
                      %
                    </p>
                    <p>
                      <strong>Scanned by:</strong> {user?.firstName}{" "}
                      {user?.lastName}
                    </p>
                    <p>
                      <strong>Store:</strong>{" "}
                      {user?.store_name || user?.store_id || "Not assigned"}
                    </p>
                    <p>
                      <strong>Time:</strong> {new Date().toLocaleString()}
                    </p>
                    <p>
                      <strong>Transaction ID:</strong>{" "}
                      {scanResult.data.transaction_id}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="qr-scanner-failure">
                <div className="qr-scanner-failure-icon">❌</div>
                <h4>Error</h4>
                <p>{scanResult?.message || "Failed to process scan"}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="qr-scanner-processing">
          <div className="qr-scanner-processing-spinner"></div>
          <p>Processing scan...</p>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
