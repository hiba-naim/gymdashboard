import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

function initials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  return (parts[0]?.[0] || "?") + (parts[1]?.[0] || "");
}

function avatarColor(name) {
  const s = String(name || "member");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) % 360;
  }
  const h2 = (h + 30) % 360;
  return `linear-gradient(135deg, hsl(${h} 60% 55%), hsl(${h2} 60% 48%))`;
}

export default function DataTable({ data }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const pageSize = 5; // fixed per request

  const rows = Array.isArray(data) ? data : [];

  const fields = useMemo(() => {
    if (!rows.length) return [];
    const keys = new Set(Object.keys(rows[0]));

    const out = [];
    // name column (we present it as the first column)
    if (["name", "member_name", "full_name"].some((k) => keys.has(k))) {
      out.push("name");
    }

    // commonly desired columns (only if present)
    if (["email", "member_email"].some((k) => keys.has(k))) out.push("email");
    if (["member_id", "id", "ID"].some((k) => keys.has(k))) out.push("member_id");
    if (["role"].some((k) => keys.has(k))) out.push("role");
    if (["created_at", "joined_at", "date_joined"].some((k) => keys.has(k)))
      out.push("joined");
    if (["location", "city"].some((k) => keys.has(k))) out.push("location");

    // Add more useful dataset-specific fields (priority list)
    const priority = [
      "phone",
      "phone_number",
      "gender",
      "abonement_type",
      "abonoment_type",
      "visit_per_week",
      "days_per_week",
      "avg_time_in_gym",
      "bmi",
      "activity_type",
    ];
    for (const p of priority) {
      if (keys.has(p) && !out.includes(p)) out.push(p);
    }

    // As a final fallback, include any other top-level keys up to a safe limit
    if (out.length < 6) {
      for (const k of Object.keys(rows[0])) {
        if (!out.includes(k) && !["id", "ID"].includes(k) && out.length < 8) out.push(k);
      }
    }

    return out;
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(Math.max(0, page), totalPages - 1);
  const pageRows = rows.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  function labelFor(field) {
    if (field === "name") return "Member";
    if (field === "member_id") return "Member ID";
    if (field === "joined") return "Joined";
    return String(field).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function getValue(row, field) {
    if (field === "name") return row.name ?? row.member_name ?? row.full_name ?? "";
    if (field === "email") return row.email ?? row.member_email ?? "";
    if (field === "member_id") return row.member_id ?? row.id ?? row.ID ?? "";
    if (field === "role") return row.role ?? (row.is_trainer ? "Trainer" : "Member");
    if (field === "joined") return row.created_at ?? row.joined_at ?? row.date_joined ?? "";
    if (field === "location") return row.location ?? row.city ?? "";
    return row[field] ?? "";
  }

  function renderAbonementBadge(value) {
    if (!value) return <span className="muted">—</span>;
    const text = String(value).toLowerCase().trim();
    let className = "badge";
    
    // Color by abonement type
    if (text.includes("premium")) {
      className = "badge badge-premium";
    } else if (text.includes("standard")) {
      className = "badge badge-standard";
    } else if (text.includes("active") || text.includes("yes") || text === "1" || text === "true") {
      className = "badge badge-status-active";
    } else {
      className = "badge badge-status-banned";
    }
    
    return <div className={className}>{value}</div>;
  }

  function renderAvatar(row, name) {
    const avatarUrl = row.avatar ?? row.photo ?? row.image ?? row.avatar_url;
    if (avatarUrl && typeof avatarUrl === "string" && avatarUrl.trim()) {
      return (
        <div className="avatar">
          <img src={avatarUrl} alt={name} />
        </div>
      );
    }
    const color = avatarColor(name);
    return (
      <div className="avatar" aria-hidden style={{ background: color }}>
        {initials(name)}
      </div>
    );
  }

  return (
    <div className="users-table">
      <div className="users-table-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div className="muted">Showing {rows.length} members</div>
      </div>

      <div className="table-container">
        <table className="users-table-table">
          <thead>
            <tr>
              {/* Member column */}
              <th>{labelFor("name")}</th>

              {/* Dynamic columns based on dataset */}
              {fields
                .filter((f) => f !== "name")
                .map((f) => (
                  <th key={f}>{labelFor(f)}</th>
                ))}

              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => {
              const name = getValue(row, "name") || `Member ${currentPage * pageSize + i + 1}`;
              const memberId = getValue(row, "member_id");

              return (
                <tr key={currentPage * pageSize + i} className="user-row">
                  <td>
                    <div className="user-cell">
                      {renderAvatar(row, name)}
                      <div>
                        <div className="user-name">{name}</div>
                        {fields.includes("location") ? (
                          <div className="muted" style={{ fontSize: 12 }}>
                            {getValue(row, "location")}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  {fields
                    .filter((f) => f !== "name")
                    .map((f) => (
                      <td key={f} className={f === "email" || f === "member_id" ? "mono" : ""}>
                        {(f === "abonement_type" || f === "abonoment_type") ? renderAbonementBadge(getValue(row, f)) : getValue(row, f)}
                      </td>
                    ))}

                  <td style={{ textAlign: "right" }}>
                    <div className="actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/member/${encodeURIComponent(memberId || name)}`, { state: { row } })}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination" style={{ marginTop: 12 }}>
        <div className="muted" style={{ alignSelf: 'center' }}>Page {currentPage + 1} of {totalPages}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setPage(0)} disabled={currentPage === 0}>« First</button>
          <button className="btn btn-ghost" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}>‹ Prev</button>
          <button className="btn btn-ghost" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}>Next ›</button>
          <button className="btn btn-ghost" onClick={() => setPage(totalPages - 1)} disabled={currentPage >= totalPages - 1}>Last »</button>
        </div>
      </div>
    </div>
  );
}
