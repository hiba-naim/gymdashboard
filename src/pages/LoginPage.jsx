import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/login.css';

export default function LoginPage({ onLoginSuccess }) {
  const [loginRole, setLoginRole] = useState(null); // 'admin' or 'member' or null
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Send login request to backend
      const response = await axios.post('http://localhost:5000/api/login', {
        username: username.trim(),
        password: password
      });

      if (response.data.success) {
        // Verify the user role matches the login type
        const userRole = response.data.user.role;
        const expectedRole = loginRole === 'admin' ? 'admin' : 'user';
        
        if (userRole !== expectedRole) {
          setError(`Invalid credentials for ${loginRole} login`);
          setLoading(false);
          return;
        }

        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('username', response.data.user.username);
        
        // Call parent callback to update app state
        onLoginSuccess(response.data.user);
        
        setUsername('');
        setPassword('');
        
        // Navigate based on role
        setTimeout(() => {
          if (userRole === 'admin') {
            navigate('/', { replace: true });
          } else {
            navigate('/profile', { replace: true });
          }
        }, 100);
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || 'Login failed');
      } else if (err.request) {
        setError('Could not connect to server. Make sure backend is running on port 5000.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRoleSelect = () => {
    setLoginRole(null);
    setUsername('');
    setPassword('');
    setError('');
  };

  // Role selection screen
  if (!loginRole) {
    return (
      <div className="login-container">
        <div className="login-box login-role-selector">
          <h1>Gym Dashboard</h1>
          <p className="login-subtitle">Select Login Type</p>
          
          <div className="role-buttons-container">
            <button
              className="role-button member-button"
              onClick={() => setLoginRole('member')}
            >
              <div className="role-icon">👤</div>
              <div className="role-title">Member Login</div>
              <div className="role-description">Access your profile</div>
            </button>
            
            <button
              className="role-button admin-button"
              onClick={() => setLoginRole('admin')}
            >
              <div className="role-icon">🔐</div>
              <div className="role-title">Admin Login</div>
              <div className="role-description">Manage all members</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login form screen
  return (
    <div className="login-container">
      <div className="login-box">
        <button className="back-button" onClick={handleBackToRoleSelect} title="Back">
          ← Back
        </button>
        
        <h1>Gym Dashboard</h1>
        <p className="login-subtitle">
          {loginRole === 'admin' ? 'Admin Login' : 'Member Login'}
        </p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">
              {loginRole === 'admin' ? 'Admin Username' : 'Member Username'}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={loginRole === 'admin' ? 'Enter admin username' : 'e.g., user_1'}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              {loginRole === 'admin' ? 'Admin Password' : 'Password'}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={loginRole === 'admin' ? 'Enter admin password' : 'e.g., pass_1'}
              disabled={loading}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : `${loginRole === 'admin' ? 'Admin' : 'Member'} Login`}
          </button>
        </form>
      </div>
    </div>
  );
}
