import React, { useState, useRef, useEffect } from "react";
import { vapeAvatars, getAvatarById } from "../../assets/avatars/vape-avatars";
import "./AvatarSelector.css";

const AvatarSelector = ({
  selectedAvatarId,
  onAvatarSelect,
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredAvatars = vapeAvatars.filter((avatar) =>
    avatar.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAvatarClick = (avatarId) => {
    onAvatarSelect(avatarId);
    onClose();
    setSearchTerm("");
  };

  if (!isOpen) return null;

  return (
    <div className="avatar-selector-overlay" onClick={onClose}>
      <div
        className="avatar-selector-modal"
        ref={dropdownRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="avatar-selector-header">
          <h3>Choose Your Avatar</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="avatar-search">
          <input
            type="text"
            placeholder="Search avatars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="avatar-grid">
          {filteredAvatars.map((avatar) => (
            <div
              key={avatar.id}
              className={`avatar-option ${
                selectedAvatarId === avatar.id ? "selected" : ""
              }`}
              onClick={() => handleAvatarClick(avatar.id)}
            >
              <div className="avatar-preview">
                <div
                  className="avatar-svg-container"
                  dangerouslySetInnerHTML={{ __html: avatar.svg }}
                />
              </div>
              <span className="avatar-name">{avatar.name}</span>
            </div>
          ))}
        </div>

        {filteredAvatars.length === 0 && (
          <div className="no-results">
            <p>No avatars found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarSelector;
