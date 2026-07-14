import { useState } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:8080/users';

function App() {
  const [currentView, setCurrentView] = useState('login'); 
  const [message, setMessage] = useState({ text: '', isError: false });
  const [users, setUsers] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', userType: 'user' });

  const showMessage = (text, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage({ text: '', isError: false }), 5000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      if (response.ok) {
        // Dynamic message based on what they registered as!
        const msg = regForm.userType === 'admin' 
          ? "Admin request submitted! Waiting for approval." 
          : "Account created successfully! Please login.";
        showMessage(msg);
        setCurrentView('login');
        setRegForm({ name: '', email: '', password: '', userType: 'user' });
      } else {
        showMessage("Registration failed.", true);
      }
    } catch (error) {
      showMessage("Server error.", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      
      if (response.ok) {
        const userData = await response.json();
        setLoggedInUser(userData);
        if (userData.userType === 'admin') loadUsers();
      } else {
        // This will catch the new "Pending Approval" error from Spring Boot!
        const errorData = await response.json().catch(() => null);
        showMessage(errorData?.message || "Invalid credentials or account pending approval.", true);
      }
    } catch (error) {
      showMessage("Server connection failed.", true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      showMessage("Failed to sync users.", true);
    }
  };

  // 👑 NEW: Function to officially approve a pending admin
  const handleApprove = async (targetUser) => {
    const updatedUser = { ...targetUser, status: 'APPROVED' };
    try {
      const response = await fetch(`${API_BASE_URL}/${targetUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      if (response.ok) {
        showMessage(`${targetUser.name} has been approved as an Admin!`);
        loadUsers(); 
      }
    } catch (error) {
      showMessage("Error approving user.", true);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    const updatedUser = { ...targetUser, userType: newRole };
    try {
      const response = await fetch(`${API_BASE_URL}/${targetUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      if (response.ok) loadUsers();
    } catch (error) {
      showMessage("Error updating role.", true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure? This cannot be undone.`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        showMessage("Account removed.");
        loadUsers();
      }
    } catch (error) {
      showMessage("Failed to delete user.", true);
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setLoginForm({ email: '', password: '' });
    setCurrentView('login');
  };

  // 🗂️ DATA SPLITTING: Separate Active users from Pending users
  const activeUsers = users.filter(u => u.status !== 'PENDING' && (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())));
  const pendingAdmins = users.filter(u => u.status === 'PENDING');
  const totalAdmins = activeUsers.filter(u => u.userType === 'admin').length;

  // ================= RENDER LOGGED OUT =================
  if (!loggedInUser) {
    return (
      <div className="auth-layout">
        {message.text && <div className={`toast ${message.isError ? 'error' : 'success'}`}>{message.text}</div>}
        <div className="auth-card">
          <div className="auth-header">
            <h2>{currentView === 'login' ? 'System Login' : 'Create Account'}</h2>
          </div>
          {currentView === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
              </div>
              <button type="submit" disabled={isLoading}>{isLoading ? 'Authenticating...' : 'Sign In'}</button>
              <p className="auth-switch">New here? <span onClick={() => setCurrentView('register')}>Create an account</span></p>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" required value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" required value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input type="password" required value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Account Type</label>
                <select value={regForm.userType} onChange={e => setRegForm({...regForm, userType: e.target.value})}>
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator (Requires Approval)</option>
                </select>
              </div>
              <button type="submit" disabled={isLoading}>{isLoading ? 'Processing...' : 'Register Account'}</button>
              <p className="auth-switch">Already have an account? <span onClick={() => setCurrentView('login')}>Sign in</span></p>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ================= RENDER LOGGED IN =================
  return (
    <div className="dashboard-layout">
      {message.text && <div className={`toast ${message.isError ? 'error' : 'success'}`}>{message.text}</div>}
      
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-placeholder"></div>
          <h3>System<strong>UI</strong></h3>
        </div>
        <div className="sidebar-menu">
          <div className="menu-item active">Dashboard</div>
        </div>
        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="avatar">{loggedInUser.name.charAt(0)}</div>
            <div className="user-info">
              <span className="user-name">{loggedInUser.name}</span>
              <span className="user-role">{loggedInUser.userType}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="content-header">
          <h1>Overview</h1>
          {loggedInUser.userType === 'admin' && (
            <button className="btn-primary" onClick={loadUsers}>Refresh Data</button>
          )}
        </header>

        {loggedInUser.userType === 'admin' ? (
          <div className="admin-view">
            
            {/* 🚨 NEW: PENDING APPROVALS QUEUE */}
            {pendingAdmins.length > 0 && (
              <div className="table-container" style={{ marginBottom: '40px', border: '2px solid #000' }}>
                <div className="table-toolbar" style={{ backgroundColor: '#f3f4f6' }}>
                  <h3>⚠️ Action Required: Pending Admin Approvals ({pendingAdmins.length})</h3>
                </div>
                <table className="data-table">
                  <tbody>
                    {pendingAdmins.map(user => (
                      <tr key={user.id}>
                        <td><span className="fw-600">{user.name}</span> <br/><span className="text-muted">{user.email}</span></td>
                        <td><span style={{ padding: '6px 12px', background: '#e5e7eb', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>PENDING ADMIN</span></td>
                        <td className="text-right">
                          <button style={{ marginRight: '10px', background: '#000', color: 'white' }} onClick={() => handleApprove(user)}>Approve</button>
                          <button className="btn-icon danger" onClick={() => handleDelete(user.id)}>Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* STATS GRID */}
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Total Active Users</h4>
                <h2>{activeUsers.length}</h2>
              </div>
              <div className="stat-card">
                <h4>Active Admins</h4>
                <h2>{totalAdmins}</h2>
              </div>
              <div className="stat-card">
                <h4>Pending Requests</h4>
                <h2>{pendingAdmins.length}</h2>
              </div>
            </div>

            {/* EXISTING DATA TABLE */}
            <div className="table-container">
              <div className="table-toolbar">
                <h3>Active Directory</h3>
                <input type="text" className="search-input" placeholder="Search active users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>User</th><th>Email Address</th><th>Role</th><th className="text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {activeUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="table-user-cell">
                          <div className="avatar-small">{user.name.charAt(0)}</div>
                          <span className="fw-600">{user.name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{user.email}</td>
                      <td>
                        <select className={`role-select ${user.userType === 'admin' ? 'role-admin' : 'role-user'}`} value={user.userType} onChange={(e) => handleRoleChange(user, e.target.value)}>
                          <option value="user">Standard</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="text-right">
                        <button className="btn-icon danger" onClick={() => handleDelete(user.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* USER VIEW */
          <div className="user-view">
             {/* Same as before... */}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;