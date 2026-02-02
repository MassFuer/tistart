import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useNavigation } from "../../context/NavigationContext";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import { useMessaging } from "../../context/MessagingContext";
import { toast } from "sonner";
import logo from "../../assets/logo.jpg";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  Calendar,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  Heart,
  Package,
  Palette,
  LayoutDashboard,
  ShieldAlert,
  Moon,
  Sun,
  MessageCircle,
  Film,
  Home,
  Image as ImageIcon,
  CreditCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, isAuthenticated, isVerifiedArtist, isAdmin, isSuperAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { unreadCount } = useMessaging();
  const { isNavbarHidden, setIsNavbarHidden } = useNavigation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const navigate = useNavigate();
  const { scrollY } = useScroll();

  // Hide navbar on scroll down
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 20) {
      setIsNavbarHidden(true);
    } else {
      setIsNavbarHidden(false);
    }
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      // Stay on same page - ProtectedRoute will naturally redirect if needed
      setIsSheetOpen(false);
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const handleNavClick = () => {
    window.scrollTo(0, 0);
    setIsSheetOpen(false);
  };

  const NAV_LINKS = [
    { to: "/", label: "Home", icon: Home },
    { to: "/gallery", label: "Gallery", icon: ImageIcon },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/videos", label: "Videos", icon: Film },
    { to: "/pricing", label: "Plans", icon: CreditCard },
  ];

  const NavItems = ({ mobile = false }) => (
    <>
      {NAV_LINKS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-2 text-sm font-medium transition-colors hover:text-foreground ${
              isActive ? "text-foreground font-bold" : "text-muted-foreground"
            } ${mobile ? "text-lg py-2 w-full" : "px-3 py-2"}`
          }
          onClick={handleNavClick}
        >
          <Icon className="h-4 w-4" />
          <span className={mobile ? "" : "hidden lg:inline"}>{label}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" }
      }}
      animate={isNavbarHidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="w-full flex h-16 items-center px-4 md:px-12">
        {/* LOGO - Left */}
        <Link to="/" className="mr-6 flex items-center space-x-2 flex-none" onClick={handleNavClick}>
          <img src={logo} alt="Nemesis" className="h-8 w-8 rounded-full object-cover" />
          <span className="hidden font-bold sm:inline-block text-xl tracking-tight">Nemesis</span>
        </Link>

        {/* DESKTOP NAV - Center */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-1 text-sm">
          <NavItems />
        </nav>

        {/* RIGHT ACTIONS - Right */}
        <div className="flex items-center justify-end space-x-2 ml-auto">
          
          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-9 w-9">
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Cart */}
          {isAuthenticated && (
            <Link to="/cart" onClick={handleNavClick}>
                <Button variant="ghost" className="relative h-9 px-0 w-9 lg:w-auto lg:px-3 gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden lg:inline">Cart</span>
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 lg:top-0 lg:right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground animate-in zoom-in">
                            {cartCount}
                        </span>
                    )}
                </Button>
            </Link>
          )}

          {/* User Profile / Auth */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full p-0 overflow-hidden ml-2">
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-background z-10 animate-pulse" />
                    )}
                    {user?.profilePicture ? (
                         <img src={user.profilePicture} alt={user.firstName} className="h-full w-full rounded-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4" />
                        </div>
                    )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal px-2 py-1.5">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    {user?.artistStatus && user.artistStatus !== 'none' && (
                        <Badge variant={user.artistStatus === 'verified' ? 'default' : 'secondary'} className="mt-1 w-fit text-[10px] h-5 capitalize px-1.5">
                            {user.artistStatus}
                        </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to="/favorites" onClick={handleNavClick}><Heart className="mr-2 h-4 w-4" /> Favorites</Link>
                </DropdownMenuItem>
                {(isVerifiedArtist || isAdmin || isSuperAdmin) && (
                    <DropdownMenuItem asChild>
                        <Link to={`/artists/${user._id}`} onClick={handleNavClick}><User className="mr-2 h-4 w-4" /> Public Profile</Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                    <Link to="/dashboard?tab=overview" onClick={handleNavClick}><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/dashboard?tab=activity" onClick={handleNavClick}><Package className="mr-2 h-4 w-4" /> Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/messages" className="flex items-center" onClick={handleNavClick}>
                      <MessageCircle className="mr-2 h-4 w-4" /> Messages
                      {unreadCount > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                </DropdownMenuItem>

                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild={isVerifiedArtist || isAdmin} disabled={!isVerifiedArtist && !isAdmin}>
                    {(isVerifiedArtist || isAdmin) ? (
                        <Link to="/dashboard?tab=artworks" onClick={handleNavClick}><Palette className="mr-2 h-4 w-4" /> Artworks</Link>
                    ) : (
                        <span className="flex items-center w-full opacity-50"><Palette className="mr-2 h-4 w-4" /> Artworks</span>
                    )}
                </DropdownMenuItem>
                 <DropdownMenuItem asChild={isVerifiedArtist || isAdmin} disabled={!isVerifiedArtist && !isAdmin}>
                    {(isVerifiedArtist || isAdmin) ? (
                        <Link to="/dashboard?tab=events" onClick={handleNavClick}><Calendar className="mr-2 h-4 w-4" /> Events</Link>
                    ) : (
                        <span className="flex items-center w-full opacity-50"><Calendar className="mr-2 h-4 w-4" /> Events</span>
                    )}
                </DropdownMenuItem>
                {isAdmin && (
                    <DropdownMenuItem asChild>
                        <Link to="/admin" onClick={handleNavClick}><ShieldAlert className="mr-2 h-4 w-4" /> Admin Panel</Link>
                    </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild>
                    <Link to="/login">Log in</Link>
                </Button>
                <Button asChild className="transition-all font-bold">
                    <Link to="/signup">Sign up</Link>
                </Button>
             </div>
          )}

          {/* MOBILE MENU (SHEET) */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col">
                <SheetHeader>
                    <SheetTitle className="text-left flex items-center gap-2">
                        <img src={logo} alt="Nemesis" className="h-6 w-6 rounded-full" />
                        Nemesis
                    </SheetTitle>
                </SheetHeader>
                <div className="grid gap-6 py-6">
                    <NavItems mobile />
                    {!isAuthenticated && (
                        <div className="flex flex-col gap-2 mt-4">
                            <Button variant="outline" asChild className="justify-start">
                                <Link to="/login" onClick={() => setIsSheetOpen(false)}>Log in</Link>
                            </Button>
                            <Button asChild className="justify-start transition-all">
                                <Link to="/signup" onClick={() => setIsSheetOpen(false)}>Sign up</Link>
                            </Button>
                        </div>
                    )}
                 </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;