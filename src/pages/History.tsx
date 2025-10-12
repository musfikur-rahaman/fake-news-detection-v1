import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Session } from "@supabase/supabase-js";
import { format } from "date-fns";

interface Detection {
  id: string;
  news_text: string;
  label: string;
  score: number;
  explanation: string | null;
  created_at: string;
}

const History = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        fetchDetections();
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

  const fetchDetections = async () => {
    try {
      const { data, error } = await supabase
        .from('detections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDetections(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching history",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('detections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDetections(detections.filter(d => d.id !== id));
      toast({
        title: "Detection deleted",
        description: "The detection has been removed from your history.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting detection",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Label', 'Confidence', 'News Text', 'Explanation'],
      ...detections.map(d => [
        format(new Date(d.created_at), 'PPpp'),
        d.label,
        `${(d.score * 100).toFixed(1)}%`,
        `"${d.news_text.replace(/"/g, '""')}"`,
        `"${(d.explanation || '').replace(/"/g, '""')}"`,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fake-news-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Your detection history has been exported to CSV.",
    });
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <Navbar session={session} />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                Detection History
              </h1>
              <p className="text-muted-foreground">
                View all your previous news analysis results
              </p>
            </div>
            
            {detections.length > 0 && (
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>

          <Card className="border-border/50 shadow-2xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Your Detections</CardTitle>
              <CardDescription>
                {detections.length} total detection{detections.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : detections.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No detections yet</p>
                  <Button onClick={() => navigate('/detector')}>
                    Analyze Your First News Article
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>News Text</TableHead>
                        <TableHead>Explanation</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detections.map((detection) => (
                        <TableRow key={detection.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(detection.created_at), 'PP')}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(detection.created_at), 'p')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={detection.label === 'FAKE' ? 'destructive' : 'default'}
                              className={detection.label === 'REAL' ? 'bg-green-500' : ''}
                            >
                              {detection.label === 'FAKE' ? '🚨 FAKE' : '✅ REAL'}
                            </Badge>
                          </TableCell>
                          <TableCell>{(detection.score * 100).toFixed(1)}%</TableCell>
                          <TableCell className="max-w-md">
                            <div className="truncate" title={detection.news_text}>
                              {detection.news_text.substring(0, 100)}
                              {detection.news_text.length > 100 && '...'}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-sm">
                            {detection.explanation ? (
                              <div className="text-sm text-muted-foreground truncate" title={detection.explanation}>
                                {detection.explanation.substring(0, 80)}
                                {detection.explanation.length > 80 && '...'}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(detection.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default History;
