"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthHeaders } from "@/store/auth";
import {
  Trophy,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Target,
} from "lucide-react";

interface ResultEntry {
  id: string;
  quizTitle: string;
  noteTitle: string;
  score: number;
  total: number;
  percentage: number;
  date: string;
}

interface Recommendation {
  topic: string;
  noteId: string;
  noteTitle: string;
  averageScore: number;
  attempts: number;
  priority: "high" | "medium" | "low";
  message: string;
}

export function ResultsView() {
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resultsRes, recsRes] = await Promise.all([
        fetch("/api/results", { headers: getAuthHeaders() }),
        fetch("/api/recommendations", { headers: getAuthHeaders() }),
      ]);

      if (resultsRes.ok) setResults(await resultsRes.json());
      if (recsRes.ok) setRecommendations(await recsRes.json());
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Results &amp; Recommendations</h2>
          <p className="text-muted-foreground">Track your progress and review weak areas</p>
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
      : 0;

  const bestScore =
    results.length > 0 ? Math.max(...results.map((r) => r.percentage)) : 0;
  const worstScore =
    results.length > 0 ? Math.min(...results.map((r) => r.percentage)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Results &amp; Recommendations</h2>
        <p className="text-muted-foreground">Track your progress and identify areas to review</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Quizzes</span>
            </div>
            <div className="text-2xl font-bold">{results.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Average Score</span>
            </div>
            <div className="text-2xl font-bold">{avgScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Best Score</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{bestScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-rose-500" />
              <span className="text-sm text-muted-foreground">Needs Work</span>
            </div>
            <div className="text-2xl font-bold text-rose-600">
              {worstScore}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Recommended Topics to Review
            </CardTitle>
            <CardDescription>
              Based on your quiz performance, here are topics that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${
                      rec.priority === "high"
                        ? "border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20"
                        : rec.priority === "medium"
                        ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
                        : "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              rec.priority === "high"
                                ? "destructive"
                                : rec.priority === "medium"
                                ? "secondary"
                                : "outline"
                            }
                            className="uppercase text-xs"
                          >
                            {rec.priority} priority
                          </Badge>
                          <span className="font-semibold text-sm">{rec.topic}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rec.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          From: {rec.noteTitle} • {rec.attempts} attempt{rec.attempts > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-center shrink-0">
                        <div className={`text-lg font-bold ${
                          rec.averageScore < 40 ? "text-rose-600" : rec.averageScore < 70 ? "text-amber-600" : "text-emerald-600"
                        }`}>
                          {rec.averageScore}%
                        </div>
                        <p className="text-xs text-muted-foreground">avg score</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Results History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Quiz History
          </CardTitle>
          <CardDescription>
            {results.length === 0
              ? "No quiz results yet. Take your first quiz to see results here."
              : `${results.length} quiz result${results.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Complete a quiz to see your results</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {results.map((result, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          result.percentage >= 80
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : result.percentage >= 50
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                        }`}
                      >
                        {result.percentage >= 80 ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          result.percentage
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{result.quizTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.noteTitle} • {new Date(result.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-mono font-medium">
                          {result.score}/{result.total}
                        </p>
                      </div>
                      <Badge
                        variant={
                          result.percentage >= 80
                            ? "default"
                            : result.percentage >= 50
                            ? "secondary"
                            : "destructive"
                        }
                        className="w-14 justify-center"
                      >
                        {result.percentage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Score Trend */}
      {results.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Score Trend</CardTitle>
            <CardDescription>Your quiz performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.slice(0, 10).map((result, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">
                    {new Date(result.date).toLocaleDateString()}
                  </span>
                  <div className="flex-1">
                    <Progress
                      value={result.percentage}
                      className="h-3"
                    />
                  </div>
                  <span className="text-sm font-mono w-10 text-right">
                    {result.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
