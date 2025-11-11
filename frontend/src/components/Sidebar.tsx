import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/cn';
import { primaryNav, NavItem } from '../config/navigation';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auto-expand menus if any child is active
  const getExpandedMenusForLocation = (pathname: string): Set<string> => {
    const expanded = new Set<string>();
    primaryNav.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => pathname === child.path);
        if (hasActiveChild) {
          expanded.add(item.key);
        }
      }
    });
    return expanded;
  };

  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(getExpandedMenusForLocation(location.pathname));

  // Update expanded menus when location changes
  useEffect(() => {
    const newExpanded = getExpandedMenusForLocation(location.pathname);
    setExpandedMenus(prev => {
      // Merge with existing expanded menus (don't collapse if user manually expanded)
      const merged = new Set(prev);
      newExpanded.forEach(key => merged.add(key));
      return merged;
    });
  }, [location.pathname]);

  const allowed = (roles?: Array<'superadmin' | 'employer' | 'employee'>) => {
    if (!roles || roles.length === 0) return true;
    const isStaff = (user as any)?.is_staff === true;
    // Map legacy/alternate roles to app roles
    const rawRole = (user as any)?.role as string | undefined;
    const normalizedRole = (rawRole === 'admin' ? 'superadmin' : rawRole) as 'superadmin' | 'employer' | 'employee' | undefined;
    // Staff should have access to all gated items
    if (isStaff) return true;
    return normalizedRole ? roles.includes(normalizedRole) : false;
  };

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isMenuExpanded = (key: string) => expandedMenus.has(key);

  const filterItems = (items: NavItem[]): NavItem[] => {
    return items.filter(item => {
      const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase());
      const hasAccess = allowed(item.roles);
      
      if (item.children) {
        const filteredChildren = filterItems(item.children);
        return hasAccess && (matchesSearch || filteredChildren.length > 0);
      }
      
      return hasAccess && matchesSearch;
    }).map(item => {
      if (item.children) {
        return {
          ...item,
          children: filterItems(item.children)
        };
      }
      return item;
    });
  };

  const filtered = filterItems(primaryNav);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="flex items-center px-6 py-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Finance Plus</h1>
            <p className="text-xs text-gray-400">ERP System</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search navigation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {filtered.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = isMenuExpanded(item.key);
          
          if (hasChildren) {
            // Check if any child is active
            const hasActiveChild = item.children?.some(child => location.pathname === child.path);
            const isActive = hasActiveChild;
            
            return (
              <div key={item.key}>
                <button
                  onClick={() => toggleMenu(item.key)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.label}
                  </div>
                  <span className={cn(
                    'transition-transform duration-200',
                    isExpanded ? 'rotate-90' : ''
                  )}>
                    ▶
                  </span>
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children?.map((child) => {
                      const isChildActive = location.pathname === child.path;
                      return (
                        <Link
                          key={child.key}
                          to={child.path || '#'}
                          className={cn(
                            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                            isChildActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          )}
                        >
                          <span className="mr-3 text-base">{child.icon}</span>
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          
          // Regular menu item
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.key}
              to={item.path || '#'}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.first_name?.[0] || user?.username?.[0] || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {(user as any)?.role || ((user as any)?.is_staff ? 'superadmin' : 'user')}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white transition-colors"
            title="Logout"
          >
            <span className="text-lg">🚪</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 
