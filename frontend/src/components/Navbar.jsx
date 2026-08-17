import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand" onClick={() => setIsOpen(false)}>
          <div className="navbar-logo">JG</div>
          <span className="navbar-name">Job<span>Graph</span></span>
        </NavLink>

        {/* Desktop Navigation */}
        <div className="navbar-links desktop-nav">
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

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setIsOpen(prev => !prev)}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
        >
          <span className={`hamburger-bar ${isOpen ? 'open' : ''}`} />
          <span className={`hamburger-bar ${isOpen ? 'open' : ''}`} />
          <span className={`hamburger-bar ${isOpen ? 'open' : ''}`} />
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="mobile-nav-menu">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <span>📊</span> Dashboard
          </NavLink>
          <NavLink
            to="/jobs"
            className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <span>💼</span> Job Discovery
          </NavLink>
          <NavLink
            to="/graph"
            className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <span>🌐</span> Graph Explorer
          </NavLink>
        </div>
      )}
    </nav>
  );
}

