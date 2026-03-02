"use client";

import React from "react";

export const Logo: React.FC = () => {
  return (
    <div className="pmcc-logo">
      <div className="pmcc-logo__icon">
        <svg
          width="40"
          height="40"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="48" fill="#1e3a5f" stroke="#c9a227" strokeWidth="3" />
          <path
            d="M50 15L53 35H67L56 47L60 67L50 57L40 67L44 47L33 35H47L50 15Z"
            fill="#c9a227"
          />
          <text
            x="50"
            y="88"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="12"
            fontWeight="600"
            fontFamily="system-ui"
          >
            4TH WATCH
          </text>
        </svg>
      </div>
      <div className="pmcc-logo__text">
        <span className="pmcc-logo__title">PMCC Admin</span>
        <span className="pmcc-logo__subtitle">US District</span>
      </div>
    </div>
  );
};

export default Logo;
