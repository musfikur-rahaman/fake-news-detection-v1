import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Session } from "@supabase/supabase-js";

const Detector = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [newsText, setNewsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ label: string; score: number; explanation: string } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAnalyze = async () => {
    if (!newsText.trim()) {
      toast({
        title: "Please enter some text",
        description: "You need to provide news content to analyze.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('detect-fake-news', {
        body: { newsText },
      });

      if (error) throw error;

      setResult(data);
      
      toast({
        title: "Analysis complete!",
        description: `The news has been classified as ${data.label}.`,
      });
    } catch (error: any) {
      console.error('Error analyzing news:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "An error occurred while analyzing the news.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <Navbar session={session} />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              AI-Powered News Detector
            </h1>
            <p className="text-muted-foreground text-lg">
              Paste any news article, headline, or paragraph to verify its authenticity
            </p>
          </div>

          <Card className="border-border/50 shadow-2xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Enter News Content</CardTitle>
              <CardDescription>
                Our AI will analyze the text and determine if it's likely to be fake or real news
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your news content here..."
                value={newsText}
                onChange={(e) => setNewsText(e.target.value)}
                className="min-h-[200px] bg-secondary/50 border-border/50 resize-none"
              />
              
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  "🔍 Analyze News"
                )}
              </Button>

              {result && (
                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Alert
                    className={
                      result.label === 'FAKE'
                        ? 'border-destructive/50 bg-destructive/10'
                        : 'border-green-500/50 bg-green-500/10'
                    }
                  >
                    <div className="flex items-start gap-3">
                      {result.label === 'FAKE' ? (
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-lg mb-1">
                          {result.label === 'FAKE' ? '🚨 FAKE NEWS DETECTED' : '✅ REAL NEWS'}
                        </div>
                        <AlertDescription className="text-sm opacity-90">
                          Confidence: {(result.score * 100).toFixed(1)}%
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>

                  {result.explanation && (
                    <Card className="border-border/30 bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-base">AI Explanation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.explanation}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Detector;
