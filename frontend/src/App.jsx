import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Dashboard    from './pages/Dashboard';
import JobDiscovery from './pages/JobDiscovery';
import JobDetail    from './pages/JobDetail';
import GraphExplorer from './pages/GraphExplorer';

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/"        element={<Dashboard />} />
            <Route path="/jobs"    element={<JobDiscovery />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/graph"   element={<GraphExplorer />} />
            <Route path="*"        element={
              <div className="empty-state" style={{ paddingTop: '6rem' }}>
                <div className="empty-state-icon">🗺️</div>
                <div className="empty-state-title">Page not found</div>
                <a href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Go to Dashboard</a>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
