import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { stampTransactionAPI } from "../../utils/api";
import { Scanner } from "@yudiel/react-qr-scanner";
import "./QRCodeScanner.css";

const QRCodeScanner = () => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const startScanning = (e) => {
    e?.preventDefault();
    setIsScanning(true);
    setScanResult(null);
  };

  const stopScanning = (e) => {
    e?.preventDefault();
    setIsScanning(false);
  };

  const handleScan = async (data) => {
    console.log("QR Code detected:", data);
    if (!data || isProcessing) return;

    try {
      setIsProcessing(true);

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
        action_type: qrData.action_type || 'stamp', // Include action type
        progress_id: qrData.progress_id || null, // Include progress ID for redemptions
        store_id: user.store_id || null,
        reset_progress: qrData.reset_progress || false, // Pass the reset flag
      });

      // Use the message from the API response
      setScanResult({
        success: true,
        message: response.message || "Scan processed successfully!",
        data: response.data,
      });

      // Stop scanning and show result for 2 seconds, then reset
      setIsScanning(false);
      setTimeout(() => {
        setScanResult(null);
      }, 2000);

    } catch (err) {
      console.error("Error processing scan:", err);
      setScanResult({
        success: false,
        message: err.message || "Failed to process scan",
      });
      
      // Stop scanning and show error for 3 seconds, then reset
      setIsScanning(false);
      setTimeout(() => {
        setScanResult(null);
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="qr-scanner-container">
      {/* Main Scan Button - Show when not scanning and no recent result */}
      {!isScanning && !scanResult && (
        <div className="qr-scanner-main">
          <button 
            type="button"
            className="qr-scanner-scan-btn" 
            onClick={startScanning}
            disabled={isProcessing}
          >
            <div className="qr-code-visual">
              <div className="qr-corner top-left"></div>
              <div className="qr-corner top-right"></div>
              <div className="qr-corner bottom-left"></div>
              <div className="qr-corner bottom-right"></div>
              <div className="qr-center">
                <div className="dv-brand">DV</div>
                <div className="qr-pattern">
                  <div className="qr-dot"></div>
                  <div className="qr-dot"></div>
                  <div className="qr-dot"></div>
                  <div className="qr-dot"></div>
                </div>
              </div>
            </div>
            <span className="scan-btn-text">SCAN NOW</span>
          </button>
        </div>
      )}

      {/* Camera Scanner */}
      {isScanning && (
        <div className="qr-scanner-camera">
          <div className="qr-scanner-video-container">
            <Scanner
              onScan={(result) => {
                console.log("Scanner result:", result);
                if (result && result[0] && result[0].rawValue) {
                  handleScan(result[0].rawValue);
                }
              }}
              onError={(error) => {
                console.log("Scanner error:", error);
                setScanResult({
                  success: false,
                  message: "Camera access error. Please check permissions.",
                });
                setIsScanning(false);
              }}
            />
          </div>

          <div className="qr-scanner-camera-controls">
            <button type="button" className="qr-scanner-stop-btn" onClick={stopScanning}>
              ✕ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Scan Result */}
      {scanResult && (
        <div className={`qr-scanner-result ${scanResult.success ? 'success' : 'error'}`}>
          {scanResult.success ? (
            <div className="qr-scanner-success">
              <div className="qr-scanner-success-icon">✅</div>
              <h3>Success!</h3>
              <p>{scanResult.message}</p>
              {scanResult.data && (
                <div className="qr-scanner-result-details">
                  <p><strong>Customer:</strong> {scanResult.data.customer_name}</p>
                  <p><strong>Reward:</strong> {scanResult.data.reward_name}</p>
                  <p>
                    <strong>Progress:</strong> {scanResult.data.stamps_collected}/{scanResult.data.stamps_required} stamps
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="qr-scanner-failure">
              <div className="qr-scanner-failure-icon">❌</div>
              <h3>Error</h3>
              <p>{scanResult.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Processing Indicator */}
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
