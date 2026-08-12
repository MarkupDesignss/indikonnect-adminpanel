// src/components/layout/MainLayout.tsx
import { Outlet, NavLink } from 'react-router-dom';
import { menuItems } from '@/config/menu'; // we'll create this
import Header from './Header'; // extracted header component

const MainLayout = () => {
  return (
    <div className="bg-surface-subtle text-on-surface min-h-screen flex">
      {/* Sidebar */}
      <nav className="hidden md:flex bg-surface-container-lowest text-primary fixed left-0 h-full w-[260px] border-r border-outline-variant flex-col pt-20 pb-8 px-4 z-40">
        <div className="mb-8 px-4">
          <h1 className="text-title-lg font-title-lg font-bold text-primary">IndieKonnect</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Wholesale Portal</p>
        </div>
        <div className="flex-1 space-y-1">
          {menuItems.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-2 transition-all duration-200 rounded-lg ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container font-bold scale-95'
                    : 'text-on-surface-variant hover:bg-surface-subtle'
                }`
              }
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
        {/* ... new order button, logout ... */}
        <div className="p-4">
          <NavLink to="/logout" className="flex items-center justify-center space-x-3 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container">
            <span className="text-white material-symbols-outlined">logout</span>
            <span className="text-white">Logout</span>
          </NavLink>
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:ml-[260px] w-full bg-surface-subtle mt-12">
        <Header /> {/* extracted header component */}
        <main className="flex-1 overflow-y-auto pt-20 p-margin-mobile md:p-margin-desktop">
          <Outlet /> {/* This renders the current page */}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;