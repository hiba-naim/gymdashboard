import React from 'react';
import '../styles/service-cards.css';

export default function ServiceCard({ title, active, iconActive, iconInactive, variant = 'neutral' }) {
  const isActive = Boolean(active);
  const statusText = isActive ? 'Active' : 'Inactive';
  const iconSrc = isActive ? iconActive : iconInactive;
  
  return (
    <div className={`service-card service-card--${variant} ${isActive ? 'service-card--active' : 'service-card--inactive'}`}>
      <div className="service-card__icon">
        {iconSrc ? (
          <img src={iconSrc} alt={title} width="80" height="80" />
        ) : (
          <div style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.1)', borderRadius: 12 }} />
        )}
      </div>
      <h3 className="service-card__title">{title}</h3>
      <div className={`service-card__status ${isActive ? 'service-card__status--active' : 'service-card__status--inactive'}`}>
        {statusText}
      </div>
    </div>
  );
}
