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
import { useState } from "react";
import { useAuth } from "@/hooks/auth";
import { LogoutButton } from "@/components";
import { ThemeSwitch } from "@/components";
import { useTheme } from "next-themes";
import { UserRole } from "@/lib";
import { usePathname } from "next/navigation";

export default function Header() {
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const isDev = process.env.NODE_ENV === "development";
  
  // Define navigation items
  const guestNavItems = [
    { name: "Home", link: "/" },
    { name: "About Us", link: "/about" },
    { name: "Contact", link: "/contact" },
  ];

  const userNavItems = [
    { name: "Home", link: "/" },
    { name: "User Panel", link: "/user" },
    { name: "Profile", link: "/user/profile" },
  ];

  const adminNavItems = [
    { name: "Home", link: "/" },
    { name: "Dashboard", link: "/dashboard" },
    { name: "Users", link: "/dashboard/users" },
  ];

  // Determine which nav items to show based on current path and user role
  const getNavItems = () => {
    // Always show guest navigation on homepage
    if (pathname === "/") {
      return guestNavItems;
    }
    
    // Show role-specific navigation when on role-specific pages
    if (pathname?.startsWith("/user") && isAuthenticated && user?.role === UserRole.USER) {
      return userNavItems;
    }
    
    if (pathname?.startsWith("/dashboard") && isAuthenticated && user?.role === UserRole.ADMIN) {
      return adminNavItems;
    }
    
    // Default to guest navigation
    return guestNavItems;
  };

  const navItems = getNavItems();

  // Determine where to redirect when user clicks their name
  const getUserDashboardLink = () => {
    if (!isAuthenticated) return "/";
    if (user?.role === UserRole.ADMIN) return "/dashboard";
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
            {!isAuthenticated ? (
              <>
                <NavbarButton href="/login" variant="secondary">Login</NavbarButton>
                <NavbarButton 
                  href="/register" 
                  variant="primary"
                  className="!bg-black !text-white"
                >
                  Register
                </NavbarButton>
              </>
            ) : (
              <>
                <NavbarButton 
                  href={getUserDashboardLink()}
                  variant="secondary"
                  className="!px-2 !py-1 !text-sm !font-medium !bg-transparent !shadow-none !border-0 hover:!underline"
                >
                  Welcome, {user?.firstName}
                </NavbarButton>
                <LogoutButton />
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
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4 pt-4">
              <div className="flex justify-center py-2">
                <ThemeSwitch />
              </div>
              {!isAuthenticated ? (
                <>
                  <NavbarButton
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    variant="secondary"
                    className="w-full"
                  >
                    Login
                  </NavbarButton>
                  <NavbarButton
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    variant="primary"
                    className="w-full !bg-black !text-white"
                  >
                    Register
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