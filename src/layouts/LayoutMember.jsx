// src/layouts/LayoutMember.jsx
export default function LayoutMember({ header, content, profile, health, lifestyle }) {
  return (
    <div className="app">
      <header className="card topbar">{header}</header>

      {/* If a `content` prop is provided by the page, render it directly (full custom layout).
          Otherwise fall back to the legacy three-section layout. */}
      {content ? (
        <div>{content}</div>
      ) : (
        <>
          <section className="card">
            <h2 className="section-title">Profile Summary</h2>
            {profile}
          </section>
          <section className="card">
            <h2 className="section-title">Health Metrics</h2>
            {health}
          </section>
          <section className="card">
            <h2 className="section-title">Activity & Lifestyle</h2>
            {lifestyle}
          </section>
        </>
      )}
    </div>
  );
}
