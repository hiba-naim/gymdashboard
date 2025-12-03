import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/user-profile.css";

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allMembers, setAllMembers] = useState([]);

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        const res = await fetch("/gym_membership.csv");
        const csvText = await res.text();

        const parsed = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
        });

        const rows = Array.isArray(parsed.data) ? parsed.data : [];
        setAllMembers(rows);

        let targetId = id;

        // If user is not admin and no ID specified
        if (user?.role === "user" && !id) {
          // Use the member_id from the logged-in user's account
          if (user?.member_id) {
            targetId = user.member_id;
          } else {
            // Fallback to first member if no member_id set
            targetId = 1;
          }
        }

        // Find the user by ID
        const member = rows.find((row) => String(row.id) === String(targetId));

        if (!member) {
          setError("User not found");
        } else {
          setUserData(member);
        }
      } catch (err) {
        setError(String(err.message || err));
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [id, user?.role, user?.member_id]);

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="loading-spinner">Loading user data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-container">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="user-profile-container">
        <div className="error-message">User data not found</div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="profile-header">
        <h1>User Profile - ID {userData.id}</h1>
        {user?.role === "admin" && (
          <button onClick={() => navigate("/")} className="back-btn">
            Back to Dashboard
          </button>
        )}
      </div>

      <div className="profile-content">
        {/* Personal Information */}
        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>User ID:</label>
              <span>{userData.id}</span>
            </div>
            <div className="info-item">
              <label>Gender:</label>
              <span>{userData.gender || "N/A"}</span>
            </div>
            <div className="info-item">
              <label>Age:</label>
              <span>{userData.Age || "N/A"}</span>
            </div>
            <div className="info-item">
              <label>Abonnement Type:</label>
              <span className={`badge badge-${userData.abonoment_type?.toLowerCase()}`}>
                {userData.abonoment_type || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Gym Activity */}
        <div className="profile-section">
          <h2>Gym Activity</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Visits per Week:</label>
              <span>{userData.visit_per_week || "N/A"}</span>
            </div>
            <div className="info-item">
              <label>Average Time in Gym:</label>
              <span>{userData.avg_time_in_gym} min</span>
            </div>
            <div className="info-item">
              <label>Check-in Time:</label>
              <span>{userData.avg_time_check_in || "N/A"}</span>
            </div>
            <div className="info-item">
              <label>Check-out Time:</label>
              <span>{userData.avg_time_check_out || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="profile-section">
          <h2>Services</h2>
          <div className="services-grid">
            <div className="service-item">
              <label>Drink Abonnement:</label>
              <span className={userData.drink_abo ? "badge-yes" : "badge-no"}>
                {userData.drink_abo ? "Yes" : "No"}
              </span>
            </div>
            <div className="service-item">
              <label>Personal Training:</label>
              <span className={userData.personal_training ? "badge-yes" : "badge-no"}>
                {userData.personal_training ? "Yes" : "No"}
              </span>
            </div>
            {userData.personal_training && userData.name_personal_trainer && (
              <div className="service-item">
                <label>Trainer:</label>
                <span>{userData.name_personal_trainer}</span>
              </div>
            )}
            <div className="service-item">
              <label>Sauna Access:</label>
              <span className={userData.uses_sauna ? "badge-yes" : "badge-no"}>
                {userData.uses_sauna ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="profile-section">
          <h2>Weekly Schedule</h2>
          <div className="weekly-schedule">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className={`day-item ${userData[day] ? "active" : ""}`}>
                <span className="day-name">{day}</span>
                <span className="day-status">
                  {userData[day] ? "✓" : "✗"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Favorite Group Lessons */}
        {userData.has_fav_group_lesson && (
          <div className="profile-section">
            <h2>Favorite Group Lessons</h2>
            <div className="lessons-list">
              {[
                "Group_Lesson_Kickboxen",
                "Group_Lesson_BodyPump",
                "Group_Lesson_Zumba",
                "Group_Lesson_XCore",
                "Group_Lesson_Running",
                "Group_Lesson_Yoga",
                "Group_Lesson_LesMiles",
                "Group_Lesson_Pilates",
                "Group_Lesson_HIT",
                "Group_Lesson_Spinning",
                "Group_Lesson_BodyBalance",
              ].map((lesson) => (
                userData[lesson] && (
                  <span key={lesson} className="lesson-badge">
                    {lesson.replace("Group_Lesson_", "")}
                  </span>
                )
              ))}
            </div>
          </div>
        )}

        {/* Favorite Drinks */}
        {userData.has_fav_drink && (
          <div className="profile-section">
            <h2>Favorite Drinks</h2>
            <div className="drinks-list">
              {[
                { key: "fav_drink_berryboost", label: "Berry Boost" },
                { key: "fav_drink_lemon", label: "Lemon" },
                { key: "fav_drink_passion_fruit", label: "Passion Fruit" },
                { key: "fav_drink_coconut_pineapple", label: "Coconut Pineapple" },
                { key: "fav_drink_orange", label: "Orange" },
                { key: "fav_drink_black_currant", label: "Black Currant" },
              ].map((drink) => (
                userData[drink.key] && (
                  <span key={drink.key} className="drink-badge">
                    {drink.label}
                  </span>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
