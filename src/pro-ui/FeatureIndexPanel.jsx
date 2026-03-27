import React from "react";

export default function FeatureIndexPanel({ title, features = [] }) {
  return (
    <div className="spx-feature-index">
      <div className="spx-feature-index-header">{title}</div>
      <div className="spx-feature-grid">
        {features.map((feature) => (
          <div key={feature} className="spx-feature-chip">
            {feature}
          </div>
        ))}
      </div>
    </div>
  );
}
