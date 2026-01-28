import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import { useMessaging } from "../../context/MessagingContext";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpg";
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
  MessageCircle
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Assuming Avatar not installed, will fallback to img or circle
// Actually I didn't install Avatar... I'll use simple img tag or circle div
// Or use Lucide User icon

const Navbar = () => {
  const { user, isAuthenticated, isVerifiedArtist, isAdmin, isSuperAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { unreadCount } = useMessaging();
  const [hidden, setHidden] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const navigate = useNavigate();
  const { scrollY } = useScroll();

  // Hide navbar on scroll down
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
      setIsSheetOpen(false);
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const handleNavClick = () => {
    window.scrollTo(0, 0);
    setIsSheetOpen(false);
  };

  const NavItems = ({ mobile = false }) => (
    <>
      <NavLink 
        to="/" 
        className={({ isActive }) => 
          `text-sm font-medium transition-colors hover:text-foreground ${isActive ? "text-foreground font-bold" : "text-muted-foreground"} ${mobile ? "text-lg py-2" : ""}`
        }
        onClick={handleNavClick}
      >
        Home
      </NavLink>
      <NavLink 
        to="/gallery" 
        className={({ isActive }) => 
          `text-sm font-medium transition-colors hover:text-foreground ${isActive ? "text-foreground font-bold" : "text-muted-foreground"} ${mobile ? "text-lg py-2" : ""}`
        }
        onClick={handleNavClick}
      >
        Gallery
      </NavLink>
      <NavLink 
        to="/events" 
        className={({ isActive }) => 
          `text-sm font-medium transition-colors hover:text-foreground ${isActive ? "text-foreground font-bold" : "text-muted-foreground"} ${mobile ? "text-lg py-2" : ""}`
        }
        onClick={handleNavClick}
      >
        Events
      </NavLink>
      
      {isAuthenticated && (
        <NavLink 
            to="/favorites" 
            className={({ isActive }) => 
            `text-sm font-medium transition-colors hover:text-foreground ${isActive ? "text-foreground font-bold" : "text-muted-foreground"} ${mobile ? "text-lg py-2" : ""}`
            }
            onClick={handleNavClick}
        >
            Favorites
        </NavLink>
      )}
      <NavLink 
        to="/pricing" 
        className={({ isActive }) => 
          `text-sm font-medium transition-colors hover:text-foreground ${isActive ? "text-foreground font-bold" : "text-muted-foreground"} ${mobile ? "text-lg py-2" : ""}`
        }
        onClick={handleNavClick}
      >
        Plans
      </NavLink>
    </>
  );

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" }
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="w-full flex h-16 items-center px-4 md:px-12">
        {/* LOGO - Left */}
        <Link to="/" className="mr-6 flex items-center space-x-2 flex-none" onClick={handleNavClick}>
          <img src={logo} alt="Nemesis" className="h-8 w-8 rounded-full object-cover" />
          <span className="hidden font-bold sm:inline-block text-xl tracking-tight">Nemesis</span>
        </Link>

        {/* DESKTOP NAV - Center */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-12 text-sm">
          <NavItems />
        </nav>

        {/* RIGHT ACTIONS - Right */}
        <div className="flex items-center justify-end space-x-4 ml-auto">
          
          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-9 w-9">
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Messages */}
          {isAuthenticated && (
            <Link to="/messages">
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <MessageCircle className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground animate-in zoom-in">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                <span className="sr-only">Messages</span>
              </Button>
            </Link>
          )}

          {/* Cart */}
          {isAuthenticated && (
            <Link to="/cart">
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <ShoppingCart className="h-4 w-4" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground animate-in zoom-in">
                            {cartCount}
                        </span>
                    )}
                    <span className="sr-only">Cart</span>
                </Button>
            </Link>
          )}

          {/* User Profile / Auth */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full p-0 overflow-hidden">
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
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(isVerifiedArtist || isAdmin || isSuperAdmin) && (
                    <DropdownMenuItem asChild>
                        <Link to={`/artists/${user._id}`}><User className="mr-2 h-4 w-4" /> Public Profile</Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                    <Link to="/dashboard?tab=overview"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/dashboard?tab=activity"><Package className="mr-2 h-4 w-4" /> Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/messages" className="flex items-center">
                      <MessageCircle className="mr-2 h-4 w-4" /> Messages
                      {unreadCount > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild={isVerifiedArtist || isAdmin} disabled={!isVerifiedArtist && !isAdmin}>
                    {(isVerifiedArtist || isAdmin) ? (
                        <Link to="/dashboard?tab=artworks"><Palette className="mr-2 h-4 w-4" /> Artworks</Link>
                    ) : (
                        <span className="flex items-center w-full"><Palette className="mr-2 h-4 w-4" /> Artworks</span>
                    )}
                </DropdownMenuItem>
                 <DropdownMenuItem asChild={isVerifiedArtist || isAdmin} disabled={!isVerifiedArtist && !isAdmin}>
                    {(isVerifiedArtist || isAdmin) ? (
                        <Link to="/dashboard?tab=events"><Calendar className="mr-2 h-4 w-4" /> Events</Link>
                    ) : (
                        <span className="flex items-center w-full"><Calendar className="mr-2 h-4 w-4" /> Events</span>
                    )}
                </DropdownMenuItem>
                {isAdmin && (
                    <DropdownMenuItem asChild>
                        <Link to="/admin"><ShieldAlert className="mr-2 h-4 w-4" /> Admin Panel</Link>
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
                <Button asChild className="dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all">
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
                            <Button asChild className="justify-start dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all">
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