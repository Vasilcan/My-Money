import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Acasă' },
  { path: '/transactions', label: 'Tranzacții' },
  { path: '/analysis', label: 'Analiză' },
  { path: '/settings', label: 'Setări' },
];

export default function AppLayout() {
  const navLinkClasses = 'flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md';
  const activeClasses = 'bg-gray-200 text-gray-900';
  const inactiveClasses = 'text-gray-600 hover:bg-gray-100';

  return (
    <div className="lg:flex">
      {/* Sidebar for desktop */}
      <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0 lg:border-r lg:border-gray-200">
        <div className="flex h-full flex-col p-4">
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${navLinkClasses} ${isActive ? activeClasses : inactiveClasses}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-4">
        <Outlet />
      </main>

      {/* Bottom Nav for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white lg:hidden">
        <div className="grid grid-cols-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${navLinkClasses} ${isActive ? activeClasses : inactiveClasses} h-16`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
