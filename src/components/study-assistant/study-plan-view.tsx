"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAuthHeaders } from "@/store/auth";
import { toast } from "sonner";
import {
  CalendarDays,
  Sparkles,
  Loader2,
  Clock,
  BookOpen,
} from "lucide-react";

interface StudyPlanDay {
  day: number;
  title: string;
  topics: string[];
  activities: string;
  duration: string;
}

interface StudyPlan {
  id: string;
  days: number;
  plan: StudyPlanDay[];
  createdAt: string;
  note: { title: string };
}

interface NotesViewProps {
  targetNoteId: string | null;
  onClearTarget: () => void;
}

export function StudyPlanView({ targetNoteId, onClearTarget }: NotesViewProps) {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [numDays, setNumDays] = useState(7);
  const [notes, setNotes] = useState<{ id: string; title: string }[]>([]);

  // Auto-trigger if noteId provided
  useEffect(() => {
    if (targetNoteId) {
      setSelectedNoteId(targetNoteId);
      handleOpenDialog();
      onClearTarget();
    }
  }, [targetNoteId]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notes/study-plan", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const res = await fetch("/api/notes", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.map((n: any) => ({ id: n.id, title: n.title })));
      }
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
  };

  const handleOpenDialog = async () => {
    await loadNotes();
    setShowDialog(true);
  };

  const handleGenerate = async () => {
    if (!selectedNoteId) {
      toast.error("Please select a note");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/notes/study-plan", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: selectedNoteId, days: numDays }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");

      toast.success("Study plan generated!");
      setShowDialog(false);
      loadPlans();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Study Plans</h2>
          <p className="text-muted-foreground">
            AI-generated study schedules based on your notes
          </p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate New Plan
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 w-48 bg-muted rounded mb-4" />
                <div className="h-4 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Study Plans Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Upload notes and generate a personalized study plan. The AI will organize topics by importance
              and create a day-by-day learning schedule.
            </p>
            <Button onClick={handleOpenDialog}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {plan.note.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {plan.days}-day plan • Generated{" "}
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge>{plan.days} Days</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-3">
                    {plan.plan.map((day) => (
                      <div
                        key={day.day}
                        className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                              {day.day}
                            </div>
                            <h4 className="font-semibold text-sm">{day.title}</h4>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Clock className="h-3 w-3" />
                            {day.duration}
                          </div>
                        </div>
                        <div className="ml-9 space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {day.topics.map((topic, i) => (
                              <Badge key={i} variant="outline" className="text-xs font-normal">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">{day.activities}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Study Plan</DialogTitle>
            <DialogDescription>
              Select a note and the number of days for your study plan. The AI will organize topics by importance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Note</Label>
              <select
                value={selectedNoteId}
                onChange={(e) => setSelectedNoteId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Choose a note...</option>
                {notes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="num-days">Number of Days</Label>
              <Input
                id="num-days"
                type="number"
                min={3}
                max={30}
                value={numDays}
                onChange={(e) => setNumDays(parseInt(e.target.value) || 7)}
              />
              <p className="text-xs text-muted-foreground">
                More days = more spread out learning. Recommended: 7-14 days.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
