import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import {
  Car,
  LayoutDashboard,
  Package,
  ClipboardList,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { useToast } from "@/hooks/use-toast";
import logoLight from "@/assets/logoLight.svg";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      // Check for Keycloak session first
      const keycloakUser = localStorage.getItem("keycloak_user");

      if (keycloakUser) {
        const userData = JSON.parse(keycloakUser);
        setUser({ id: userData.id, email: userData.email } as any);
        // Fetch profile from database via proxy-data
        fetchProfile(userData.id);
        setLoading(false);
        return;
      }

      // Otherwise check Supabase session
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          if (session?.user) {
            setTimeout(() => {
              fetchProfile(session.user.id);
            }, 0);
          } else {
            setProfile(null);
          }
        }
      );

      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          fetchProfile(session.user.id);
        }
      });

      return () => subscription.unsubscribe();
    };

    checkAuth();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Use proxy-data to fetch profile (bypasses RLS for Keycloak users)
      const { data: result, error } = await supabase.functions.invoke('proxy-data', {
        body: { action: 'get_my_profile', userId }
      });

      if (!error && result?.success && result?.data) {
        setProfile(result.data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    const keycloakUser = localStorage.getItem("keycloak_user");
    if (!loading && user === null && session === null && !keycloakUser) {
      navigate("/auth");
    }
  }, [user, session, loading, navigate]);

  const handleLogout = async () => {
    // Clear Keycloak session if exists
    const keycloakUser = localStorage.getItem("keycloak_user");
    const keycloakTokens = localStorage.getItem("keycloak_tokens");

    if (keycloakUser) {
      localStorage.removeItem("keycloak_user");
      localStorage.removeItem("keycloak_tokens");

      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });

      // Redirect to Keycloak logout with id_token_hint for proper session end
      const keycloakBaseUrl = "https://account.des.aureaphigital.com:8443";
      const realm = "des-aureaphigital";
      const postLogoutRedirect = `${window.location.origin}/auth`;

      let logoutUrl = `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirect)}&client_id=appmob_artemis_des_password_credential`;

      // Add id_token_hint if available for proper logout
      if (keycloakTokens) {
        try {
          const tokens = JSON.parse(keycloakTokens);
          if (tokens.id_token) {
            logoutUrl += `&id_token_hint=${tokens.id_token}`;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      window.location.href = logoutUrl;
      return;
    }

    // Otherwise logout from Supabase
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/auth");
  };

  if (loading || !user) {
    return null;
  }

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/checkin", icon: ClipboardList, label: "Check-In" },
    { to: "/checkout", icon: ClipboardList, label: "Check-Out" },
    { to: "/viaturas", icon: Car, label: "Viaturas" },
    { to: "/itens", icon: Package, label: "Itens" },
    { to: "/protocolos", icon: ClipboardList, label: "Protocolos" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar Desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-sidebar shadow-lg">
          {/* Logo */}
          <div className="flex items-center justify-center px-6 py-6 border-b border-sidebar-border">
            <img src={logoLight} alt="ARTEMIS" className="h-12 w-auto" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Info */}
          <div className="px-4 py-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.nome || user.email}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {profile?.perfil || "Usuário"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-sidebar shadow-md">
          <div className="flex items-center">
            <img src={logoLight} alt="ARTEMIS" className="h-8 w-auto" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-sidebar-foreground"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 bg-sidebar pt-16">
            <nav className="px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <div className="pt-4 border-t border-sidebar-border">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sair</span>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="md:pl-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
