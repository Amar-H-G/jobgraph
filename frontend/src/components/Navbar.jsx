import { NavLink } from 'react-router-dom';

export function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        <div className="navbar-logo">JG</div>
        <span className="navbar-name">Job<span>Graph</span></span>
      </NavLink>

      <div className="navbar-links">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <span className="nav-link-label">Dashboard</span>
        </NavLink>
        <NavLink
          to="/jobs"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <span className="nav-link-label">Job Discovery</span>
        </NavLink>
        <NavLink
          to="/graph"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <span className="nav-link-label">Graph Explorer</span>
        </NavLink>
      </div>
    </nav>
  );
}
