import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';

const MainLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--c-bg)]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
