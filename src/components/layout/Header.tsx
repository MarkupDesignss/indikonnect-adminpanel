import { useState, useEffect, useRef } from 'react';
import { adminApi, AdminProfile } from '../../api/endpoints/Auth';
import { FiMenu, FiX } from 'react-icons/fi';
import { IoNotificationsOutline, IoSettingsOutline, IoPersonOutline, IoLogOutOutline } from 'react-icons/io5';
import { MdOutlineSearch } from 'react-icons/md';
import { HiOutlineChevronDown } from 'react-icons/hi';
import { Link } from 'react-router-dom';

interface HeaderProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const Header = ({ isSidebarOpen = true, onToggleSidebar }: HeaderProps) => {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setIsLoading(true);

      const response = await adminApi.me();
      const adminData = response.data?.data?.admin;

      if (adminData) {
        setAdmin(adminData);
        sessionStorage.setItem('adminData', JSON.stringify(adminData));
      }
    } catch (error) {
      console.error('Failed to fetch admin profile:', error);

      const storedAdmin = sessionStorage.getItem('adminData');

      if (storedAdmin) {
        try {
          setAdmin(JSON.parse(storedAdmin));
        } catch (error) {
          console.error('Invalid stored admin data:', error);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminApi.logout();
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminData');
      sessionStorage.removeItem('adminPermissions');
      sessionStorage.removeItem('adminRoles');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminData');
      window.location.href = '/login';
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <header 
      className="
        bg-surface-container-lowest/95 
        backdrop-blur-sm 
        text-primary 
        border-b 
        border-outline-variant/60 
        fixed 
        top-0 
        right-0 
        z-50 
        flex 
        justify-between 
        items-center 
        px-4 
        md:px-6 
        h-[72px]
        shadow-xs
        w-full
        md:left-[280px]
        md:w-[calc(100%-280px)]
      "
    >
      {/* Left Section - Menu Icon */}
      <div className="flex items-center h-full flex-shrink-0">
        <button
          onClick={onToggleSidebar}
          className="text-on-surface-variant hover:text-primary transition-colors p-2 hover:bg-surface-subtle rounded-full"
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen ? (
            <FiMenu className="text-[28px]" />
          ) : (
            <FiX className="text-[28px]" />
          )}
        </button>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-xl mx-4 h-full flex items-center min-w-0">
        <div className="relative w-full">
          <MdOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-outline text-[19px]" />
          <input
            type="text"
            className="
              w-full 
              text-sm 
              pl-9 
              pr-4 
              py-3 
              bg-surface 
              border 
              border-border-light 
              rounded-full 
              focus:outline-none 
              focus:border-primary 
              focus:ring-1 
              focus:ring-primary/40 
              placeholder:text-on-surface-variant/70 
              transition-all
            "
            placeholder="Search orders, customers, inventory..."
          />
        </div>
      </div>

      {/* Right Section - Actions & Profile */}
      <div className="flex items-center h-full space-x-2 flex-shrink-0">
        {/* Notification Button */}
        <Link to="/notifications">
          <button
            className="text-on-surface-variant hover:bg-surface-subtle hover:text-primary transition-colors duration-200 p-2 rounded-full relative"
            aria-label="Notifications"
          >
            <IoNotificationsOutline className="text-[20px]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-status-error rounded-full ring-2 ring-surface-container-lowest"></span>
          </button>
        </Link>

        {/* Settings Button */}
        <button
          className="text-on-surface-variant hover:bg-surface-subtle hover:text-primary transition-colors duration-200 p-2 rounded-full hidden md:block"
          aria-label="Settings"
        >
          <IoSettingsOutline className="text-[20px]" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-outline-variant/60 mx-1 hidden md:block" />

        {/* Profile Avatar with Dropdown */}
        <div className="relative h-full flex items-center" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center space-x-1.5 focus:outline-none group pl-1 pr-1.5 py-1 rounded-full hover:bg-surface-subtle transition-colors"
            aria-label="Profile menu"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
              {isLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-white text-xs font-semibold tracking-tight">
                  {getInitials(admin?.name)}
                </span>
              )}
            </div>
            <HiOutlineChevronDown
              className={`text-[18px] text-on-surface-variant hidden md:inline transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-outline-variant/60 overflow-hidden animate-slideDown">
              {/* Admin Info */}
              <div className="px-4 py-4 bg-gradient-to-br from-primary/5 to-transparent border-b border-outline-variant/60">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/15">
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-white text-sm font-semibold tracking-tight">
                        {getInitials(admin?.name)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">
                      {isLoading ? 'Loading...' : admin?.name || 'Administrator'}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {admin?.email || 'admin@example.com'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role Badge */}
              {admin?.roles && admin.roles.length > 0 && (
                <div className="px-4 py-2.5 border-b border-outline-variant/60">
                  <div className="flex flex-wrap gap-1.5">
                    {admin.roles.map((role, index) => (
                      <span
                        key={index}
                        className="text-[11px] font-medium px-2 py-0.5 bg-primary-container text-on-primary-container rounded-full"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu Items */}
              <div className="py-1.5">
                <button
                  className="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-subtle transition-colors duration-150 flex items-center space-x-3"
                  onClick={() => {
                    setIsDropdownOpen(false);
                  }}
                >
                  <IoPersonOutline className="text-[18px] text-on-surface-variant" />
                  <span>My Profile</span>
                </button>

                <button
                  className="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-subtle transition-colors duration-150 flex items-center space-x-3"
                  onClick={() => {
                    setIsDropdownOpen(false);
                  }}
                >
                  <IoSettingsOutline className="text-[18px] text-on-surface-variant" />
                  <span>Settings</span>
                </button>

                <hr className="my-1.5 border-outline-variant/60" />

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-status-error hover:bg-status-error/10 transition-colors duration-150 flex items-center space-x-3"
                >
                  <IoLogOutOutline className="text-[18px]" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;