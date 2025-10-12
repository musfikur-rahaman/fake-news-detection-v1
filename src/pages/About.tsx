import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Shield, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

const About = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <Navbar session={session} />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              About Fake News Detector
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Combating misinformation with cutting-edge AI technology
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-12">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <Brain className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI-Powered</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Uses advanced language models from Hugging Face and Groq to analyze news content with high accuracy.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Secure & Private</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your data is protected with Supabase authentication and encrypted storage. Only you can access your history.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Real-Time Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get instant results with detailed explanations powered by Meta's LLaMA model via Groq's lightning-fast API.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 shadow-2xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl">How It Works</CardTitle>
              <CardDescription>Our three-step verification process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Classification</h3>
                  <p className="text-sm text-muted-foreground">
                    We use the fine-tuned "afsanehm/fake-news-detection-llm" model from Hugging Face to classify your news as FAKE or REAL with a confidence score.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Explanation Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    If the news is classified as fake, our LLaMA model (via Groq) generates a detailed explanation of why it might be misinformation.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Secure Storage</h3>
                  <p className="text-sm text-muted-foreground">
                    All your detections are securely saved in Supabase, allowing you to review your history and export the data at any time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-primary mb-1">Frontend</div>
                  <ul className="text-muted-foreground space-y-1">
                    <li>React + TypeScript</li>
                    <li>Tailwind CSS</li>
                    <li>shadcn/ui</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-primary mb-1">Backend</div>
                  <ul className="text-muted-foreground space-y-1">
                    <li>Supabase</li>
                    <li>Edge Functions</li>
                    <li>PostgreSQL</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-primary mb-1">AI Models</div>
                  <ul className="text-muted-foreground space-y-1">
                    <li>Hugging Face API</li>
                    <li>Groq (LLaMA)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
