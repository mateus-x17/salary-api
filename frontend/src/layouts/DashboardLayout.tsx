import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({ title = 'Dashboard', subtitle }: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-layout__main">
        <Header title={title} subtitle={subtitle} />
        <main className="dashboard-layout__content page-enter">
          {/* Background decorations */}
          <div className="bg-decoration bg-decoration--1" />
          <div className="bg-decoration bg-decoration--2" />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
