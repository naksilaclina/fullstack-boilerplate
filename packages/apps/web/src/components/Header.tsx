"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import { LogoutButton } from "@/components";
import { ThemeSwitch } from "@/components";
import { useTheme } from "next-themes";
import { UserRole } from "@/lib";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch } from "@/store";
import { refreshAuthStatus } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
// Import icons from lucide-react
import {
  Home,
  Info,
  Phone,
  User,
  Settings,
  Users,
  Monitor,
  LogIn,
  UserPlus,
  LogOut,
  Menu,
  X,
  ArrowLeftRight
} from "lucide-react";

export default function Header() {
  const { isAuthenticated, user, isReady } = useAuth();
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isDev = process.env.NODE_ENV === "development";

  // Check auth status periodically to ensure session is still valid
  useEffect(() => {
    // Only refresh for authenticated users
    if (!isReady || !isAuthenticated) {
      return;
    }

    // Set up an interval to periodically check auth status
    const interval = setInterval(() => {
      dispatch(refreshAuthStatus());
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [isReady, isAuthenticated, dispatch]);

  // Define navigation items with icons
  const guestNavItems = [
    { name: "Home", link: "/", icon: Home },
    { name: "About Us", link: "/about", icon: Info },
    { name: "Contact", link: "/contact", icon: Phone },
  ];

  const userNavItems = [
    { name: "Home", link: "/", icon: Home },
    { name: "User Panel", link: "/user", icon: User },
    { name: "Profile", link: "/user/profile", icon: Settings },
  ];

  const adminNavItems = [
    { name: "Home", link: "/", icon: Home },
    { name: "Dashboard", link: "/admin", icon: Monitor },
    { name: "Users", link: "/admin/users", icon: Users },
    { name: "Sessions", link: "/admin/sessions", icon: User },
  ];

  // Determine which nav items to show based on current path and user role
  const getNavItems = () => {
    // Always show guest navigation on homepage
    if (pathname === "/") {
      return guestNavItems;
    }

    // Show user navigation when on user pages (for both user and admin roles)
    if (pathname?.startsWith("/user") && isAuthenticated) {
      return userNavItems;
    }

    // Show admin navigation when on admin pages (only for admin role)
    if (pathname?.startsWith("/admin") && isAuthenticated && user?.role === UserRole.ADMIN) {
      return adminNavItems;
    }

    // Default to guest navigation
    return guestNavItems;
  };

  const navItems = getNavItems();

  // Determine where to redirect when user clicks their name
  const getUserDashboardLink = () => {
    if (!isAuthenticated) return "/";
    if (user?.role === UserRole.ADMIN) return "/admin";
    if (user?.role === UserRole.USER) return "/user";
    return "/";
  };

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems
            items={navItems}
            onItemClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="flex items-center gap-4">
            <ThemeSwitch />
            {/* Show nothing while auth state is initializing */}
            {!isReady ? null : !isAuthenticated ? (
              <>
                <NavbarButton href="/login" variant="secondary">
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Login
                  </span>
                </NavbarButton>
                <NavbarButton
                  href="/register"
                  variant="primary"
                  className="!bg-black !text-white"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Register
                  </span>
                </NavbarButton>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {/* Switch panel button for admin users */}
                  {user?.role === UserRole.ADMIN && pathname?.startsWith("/admin") && (
                    <Link href="/user" passHref>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <ArrowLeftRight className="w-4 h-4" />
                        <span className="hidden sm:inline">User Panel</span>
                      </Button>
                    </Link>
                  )}

                  {/* Switch panel button for users with admin role */}
                  {user?.role === UserRole.ADMIN && pathname?.startsWith("/user") && (
                    <Link href="/admin" passHref>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <ArrowLeftRight className="w-4 h-4" />
                        <span className="hidden sm:inline">Admin Panel</span>
                      </Button>
                    </Link>
                  )}

                  <NavbarButton
                    href={getUserDashboardLink()}
                    variant="secondary"
                    className="!px-2 !py-1 !text-sm !font-medium !bg-transparent !shadow-none !border-0 hover:!underline"
                  >
                    Welcome, {user?.firstName}
                  </NavbarButton>
                </div>
                <div className="flex items-center">
                  <LogoutButton />
                </div>
              </>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300 flex items-center gap-3 py-2 px-4 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                <item.icon className="w-5 h-5" />
                <span className="block">{item.name}</span>
              </a>
            ))}

            {/* Add switch panel buttons for mobile */}
            {isAuthenticated && user?.role === UserRole.ADMIN && (
              <div className="flex flex-col gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                {pathname?.startsWith("/admin") && (
                  <Link href="/user" passHref>
                    <Button variant="outline" size="sm" className="w-full flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                      <ArrowLeftRight className="w-4 h-4" />
                      Switch to User Panel
                    </Button>
                  </Link>
                )}

                {pathname?.startsWith("/user") && (
                  <Link href="/admin" passHref>
                    <Button variant="outline" size="sm" className="w-full flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                      <ArrowLeftRight className="w-4 h-4" />
                      Switch to Admin Panel
                    </Button>
                  </Link>
                )}
              </div>
            )}

            <div className="flex w-full flex-col gap-4 pt-4">
              <div className="flex justify-center py-2">
                <ThemeSwitch />
              </div>
              {/* Show nothing while auth state is initializing */}
              {!isReady ? null : !isAuthenticated ? (
                <>
                  <NavbarButton
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    variant="secondary"
                    className="w-full"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Login
                    </span>
                  </NavbarButton>
                  <NavbarButton
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    variant="primary"
                    className="w-full !bg-black !text-white"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Register
                    </span>
                  </NavbarButton>
                </>
              ) : (
                <>
                  <NavbarButton
                    href={getUserDashboardLink()}
                    onClick={() => setIsMobileMenuOpen(false)}
                    variant="secondary"
                    className="w-full !px-2 !py-1 !text-sm !font-medium !bg-transparent !shadow-none !border-0 hover:!underline"
                  >
                    Welcome, {user?.firstName}
                  </NavbarButton>
                  <div onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                    <LogoutButton />
                  </div>
                </>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}