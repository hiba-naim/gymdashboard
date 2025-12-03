// src/layouts/LayoutMember.jsx
export default function LayoutMember({ header, profile, health, lifestyle }) {
  return (
    <div className="app">
      <header className="card topbar">{header}</header>
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
    </div>
  );
}
