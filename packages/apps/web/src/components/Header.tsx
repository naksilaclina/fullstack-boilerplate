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
import { useAuth } from "@/hooks/useAuth";
import LogoutButton from "@/components/LogoutButton";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { useTheme } from "next-themes";

export default function Header() {
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isDev = process.env.NODE_ENV === "development";
  const navItems = [
    { name: "Home", link: "/" },
    { name: "User", link: "/user" },
  ];

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
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300 sr-only md:not-sr-only">
                  Welcome, {user?.firstName}
                </span>
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
                  <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    Welcome, {user?.firstName}
                  </div>
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