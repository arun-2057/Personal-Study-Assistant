"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthHeaders } from "@/store/auth";
import { BookOpen, FileText, Trophy, Target, TrendingUp, Clock } from "lucide-react";

interface Stats {
  totalNotes: number;
  totalQuizzes: number;
  totalResults: number;
  avgScore: number;
  recentResults: { quizTitle: string; score: number; total: number; date: string }[];
}

export function DashboardView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/stats", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome to StudyFlow! Start by uploading your notes.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-muted rounded mb-2" />
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = !stats || (stats.totalNotes === 0 && stats.totalQuizzes === 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          {isEmpty
            ? "Welcome to StudyFlow! Upload your first note to get started."
            : "Here's your learning overview."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Notes"
          value={stats?.totalNotes ?? 0}
          description="Total uploaded"
          color="text-emerald-600 bg-emerald-100 dark:bg-emerald-950"
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Quizzes"
          value={stats?.totalQuizzes ?? 0}
          description="Generated"
          color="text-amber-600 bg-amber-100 dark:bg-amber-950"
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Avg. Score"
          value={`${stats?.avgScore ?? 0}%`}
          description="Across all quizzes"
          color="text-violet-600 bg-violet-100 dark:bg-violet-950"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Attempts"
          value={stats?.totalResults ?? 0}
          description="Quiz completions"
          color="text-rose-600 bg-rose-100 dark:bg-rose-950"
        />
      </div>

      {/* Empty State */}
      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ready to Learn?</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Upload your study notes (text or PDF) and StudyFlow will automatically extract key topics,
              generate quizzes, and create personalized study plans — all without any paid APIs!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Results */}
      {stats && stats.recentResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Quiz Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentResults.map((result, i) => {
                const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{result.quizTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(result.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono">
                        {result.score}/{result.total}
                      </span>
                      <span
                        className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                          pct >= 80
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : pct >= 50
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            How StudyFlow Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <StepCard
              step={1}
              title="Upload Notes"
              description="Upload your text notes or PDF files. StudyFlow processes them locally using TF-IDF and rule-based NLP."
            />
            <StepCard
              step={2}
              title="Extract & Plan"
              description="Key topics are automatically extracted. Generate a personalized study plan based on topic importance."
            />
            <StepCard
              step={3}
              title="Quiz & Review"
              description="Take auto-generated quizzes (multiple choice, fill-in-the-blank, true/false) and get smart recommendations."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-4 rounded-lg border">
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mx-auto mb-3">
        {step}
      </div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
