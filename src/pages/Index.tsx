import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Zap, TrendingUp, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/detector");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <Navbar session={session} />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block mb-6">
            <div className="relative">
              <div className="text-6xl mb-4">📰</div>
              <div className="absolute inset-0 bg-primary/30 blur-3xl -z-10" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              Fake News Detector
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Verify news authenticity with AI-powered analysis. Get instant results backed by advanced machine learning models.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={() => navigate(session ? "/detector" : "/auth")}
              className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity text-lg px-8 py-6 gap-2"
            >
              {session ? "Go to Detector" : "Get Started Free"}
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/about")}
              className="text-lg px-8 py-6"
            >
              Learn More
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Analysis</h3>
                <p className="text-muted-foreground">
                  Get real-time results powered by Hugging Face's advanced NLP models in seconds.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Explanations</h3>
                <p className="text-muted-foreground">
                  Understand why content is flagged with detailed explanations from LLaMA AI.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Track History</h3>
                <p className="text-muted-foreground">
                  Save all detections and export your analysis history anytime as CSV.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">&lt;3s</div>
              <div className="text-sm text-muted-foreground">Analysis Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">AI</div>
              <div className="text-sm text-muted-foreground">Powered</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
