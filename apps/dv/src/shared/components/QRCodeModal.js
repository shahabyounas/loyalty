import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import "./QRCodeModal.css";

const QRCodeModal = ({ isOpen, onClose, transactionData, rewardName }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && transactionData) {
      generateQRCode();
    }
  }, [isOpen, transactionData]);

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      // Use the qr_data from transactionData if available, otherwise create it
      const qrData =
        transactionData.qr_data ||
        JSON.stringify({
          code: transactionData.transaction_code,
          user_id: transactionData.user_id,
          reward_id: transactionData.reward_id,
          expires_at: transactionData.expires_at,
        });

      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <button className="qr-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="qr-modal-body">
          <div className="qr-reward-info">
            <h4 className="qr-reward-name">{rewardName}</h4>
          </div>

          <div className="qr-code-container">
            {isLoading ? (
              <div className="qr-loading">
                <div className="qr-loading-spinner"></div>
                <p>Generating QR Code...</p>
              </div>
            ) : (
              <div className="qr-code-wrapper">
                <img src={qrCodeUrl} alt="QR Code" className="qr-code-image" />
                <div className="qr-code-overlay">
                  <div className="qr-code-logo">🏆</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="qr-modal-footer">
          <button className="qr-cancel-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
