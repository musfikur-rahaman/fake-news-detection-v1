-- Create detections table for storing news analysis results
CREATE TABLE public.detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  news_text TEXT NOT NULL,
  label TEXT NOT NULL,
  score FLOAT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own detections
CREATE POLICY "Users can view their own detections"
  ON public.detections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own detections
CREATE POLICY "Users can insert their own detections"
  ON public.detections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own detections
CREATE POLICY "Users can delete their own detections"
  ON public.detections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_detections_user_id ON public.detections(user_id);
CREATE INDEX idx_detections_created_at ON public.detections(created_at DESC);