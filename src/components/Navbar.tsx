import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Newspaper, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";

interface NavbarProps {
  session: Session | null;
}

const Navbar = ({ session }: NavbarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
      });
      navigate("/");
    }
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Newspaper className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-primary blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Fake News Detector
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          {session && (
            <>
              <Link to="/detector" className="text-muted-foreground hover:text-foreground transition-colors">
                Detector
              </Link>
              <Link to="/history" className="text-muted-foreground hover:text-foreground transition-colors">
                History
              </Link>
            </>
          )}
          <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>

          {session ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{session.user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
