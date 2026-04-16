"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthHeaders } from "@/store/auth";
import { toast } from "sonner";
import {
  HelpCircle,
  Brain,
  Loader2,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  FileText,
  Clock,
  Zap,
} from "lucide-react";

type QuestionType = "multiple-choice" | "fill-blank" | "true-false";

interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  points: number;
}

interface QuizSummary {
  id: string;
  title: string;
  noteTitle: string;
  totalPoints: number;
  questionCount: number;
  resultCount: number;
  createdAt: string;
}

interface QuizResult {
  resultId: string;
  earnedPoints: number;
  totalPoints: number;
  percentage: number;
  detailedResults: {
    questionId: string;
    type: QuestionType;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
    topic: string;
    points: number;
  }[];
}

interface NotesViewProps {
  targetNoteId: string | null;
  onClearTarget: () => void;
}

export function QuizView({ targetNoteId, onClearTarget }: NotesViewProps) {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [notes, setNotes] = useState<{ id: string; title: string }[]>([]);

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [fillBlankAnswers, setFillBlankAnswers] = useState<string[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  // Auto-trigger if noteId provided
  useEffect(() => {
    if (targetNoteId) {
      setSelectedNoteId(targetNoteId);
      handleOpenDialog();
      onClearTarget();
    }
  }, [targetNoteId]);

  const loadQuizzes = async () => {
    try {
      const res = await fetch("/api/notes/quiz", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch (err) {
      console.error("Failed to load quizzes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = async () => {
    try {
      const res = await fetch("/api/notes", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.map((n: any) => ({ id: n.id, title: n.title })));
      }
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
    setShowDialog(true);
  };

  const handleGenerate = async () => {
    if (!selectedNoteId) {
      toast.error("Please select a note");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/notes/quiz", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: selectedNoteId, numQuestions }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz");

      toast.success(`Quiz generated with ${JSON.parse(data.questions).length} questions!`);
      setShowDialog(false);
      loadQuizzes();

      // Auto-start the quiz
      startQuiz(data.id, JSON.parse(data.questions));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const initQuizState = (quizId: string, questions: QuizQuestion[]) => {
    setActiveQuiz(questions);
    setActiveQuizId(quizId);
    setCurrentQuestion(0);
    setAnswers(new Array(questions.length).fill(null));
    setFillBlankAnswers(new Array(questions.length).fill(""));
    setQuizResult(null);
  };

  const startQuiz = async (quizId: string, preloadedQuestions?: QuizQuestion[]) => {
    if (preloadedQuestions) {
      initQuizState(quizId, preloadedQuestions);
      return;
    }

    try {
      const res = await fetch(`/api/notes/quiz/${quizId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load quiz");

      const data = await res.json();
      initQuizState(quizId, data.questions);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAnswer = (value: string) => {
    if (!activeQuiz) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!activeQuiz || !activeQuizId) return;

    setSubmitting(true);
    try {
      // Merge fill-blank answers with regular answers
      const finalAnswers = answers.map((a, i) => {
        if (a === null && activeQuiz[i].type === "fill-blank") {
          return fillBlankAnswers[i] || "";
        }
        return a || "";
      });

      const res = await fetch(`/api/notes/quiz/${activeQuizId}`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit quiz");

      setQuizResult(data);
      loadQuizzes();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const exitQuiz = () => {
    setActiveQuiz(null);
    setActiveQuizId(null);
    setQuizResult(null);
    setCurrentQuestion(0);
  };

  // Active quiz UI
  if (activeQuiz && !quizResult) {
    const question = activeQuiz[currentQuestion];
    const progress = ((currentQuestion + 1) / activeQuiz.length) * 100;
    const answeredCount = answers.filter((a) => a !== null).length + 
      fillBlankAnswers.filter((a) => a.trim() !== "").length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={exitQuiz}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Exit Quiz
          </Button>
          <Badge variant="outline">
            Question {currentQuestion + 1} of {activeQuiz.length}
          </Badge>
        </div>

        <Progress value={progress} className="h-2" />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="capitalize">
                {question.type.replace("-", " ")}
              </Badge>
              <Badge variant="outline">{question.points} pts</Badge>
              <Badge variant="outline">{question.topic}</Badge>
            </div>
            <CardTitle className="text-lg leading-relaxed whitespace-pre-line mt-2">
              {question.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {question.type === "multiple-choice" && question.options && (
              <RadioGroup
                value={answers[currentQuestion] || ""}
                onValueChange={handleAnswer}
              >
                {question.options.map((option, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value={option} id={`option-${i}`} />
                    <Label
                      htmlFor={`option-${i}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === "fill-blank" && (
              <div className="space-y-2">
                <Label htmlFor="fill-answer">Your Answer:</Label>
                <Input
                  id="fill-answer"
                  placeholder="Type your answer..."
                  value={fillBlankAnswers[currentQuestion]}
                  onChange={(e) => {
                    const newAnswers = [...fillBlankAnswers];
                    newAnswers[currentQuestion] = e.target.value;
                    setFillBlankAnswers(newAnswers);
                  }}
                />
              </div>
            )}

            {question.type === "true-false" && (
              <RadioGroup
                value={answers[currentQuestion] || ""}
                onValueChange={handleAnswer}
              >
                <div className="grid grid-cols-2 gap-4">
                  {["True", "False"].map((option) => (
                    <div
                      key={option}
                      className={`flex items-center justify-center rounded-lg border p-6 hover:bg-muted/50 transition-colors cursor-pointer ${
                        answers[currentQuestion] === option
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <RadioGroupItem value={option} id={`tf-${option}`} />
                      <Label
                        htmlFor={`tf-${option}`}
                        className="cursor-pointer text-base font-medium ml-2"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              {currentQuestion < activeQuiz.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trophy className="mr-2 h-4 w-4" />
                  )}
                  Submit Quiz
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question Navigator */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {activeQuiz.map((q, i) => {
                const isAnswered = answers[i] !== null || fillBlankAnswers[i]?.trim() !== "";
                const isCurrent = i === currentQuestion;
                return (
                  <Button
                    key={q.id}
                    variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                    size="sm"
                    className="w-9 h-9 p-0"
                    onClick={() => setCurrentQuestion(i)}
                  >
                    {i + 1}
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {answeredCount} of {activeQuiz.length} questions answered
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz Result UI
  if (quizResult) {
    const { percentage, earnedPoints, totalPoints, detailedResults } = quizResult;
    const grade =
      percentage >= 90
        ? { label: "Excellent!", emoji: "🏆", color: "text-emerald-600" }
        : percentage >= 70
        ? { label: "Great Job!", emoji: "🌟", color: "text-amber-600" }
        : percentage >= 50
        ? { label: "Good Effort!", emoji: "💪", color: "text-orange-600" }
        : { label: "Keep Studying!", emoji: "📚", color: "text-rose-600" };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={exitQuiz}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Quizzes
          </Button>
        </div>

        {/* Score Card */}
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-6xl mb-4">{grade.emoji}</div>
            <h2 className={`text-3xl font-bold ${grade.color}`}>{grade.label}</h2>
            <p className="text-muted-foreground mt-2">
              You scored {earnedPoints} out of {totalPoints} points
            </p>
            <div className="mt-4 flex justify-center">
              <div className="text-5xl font-bold">{percentage}%</div>
            </div>
            <Progress value={percentage} className="h-3 mt-4 max-w-md mx-auto" />
            <div className="flex justify-center gap-6 mt-6 text-sm">
              <div className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                {detailedResults.filter((r) => r.isCorrect).length} Correct
              </div>
              <div className="flex items-center gap-1 text-rose-600">
                <XCircle className="h-4 w-4" />
                {detailedResults.filter((r) => !r.isCorrect).length} Incorrect
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-3">
            {detailedResults.map((result, i) => (
              <Card
                key={i}
                className={
                  result.isCorrect
                    ? "border-emerald-200 dark:border-emerald-900"
                    : "border-rose-200 dark:border-rose-900"
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {result.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium whitespace-pre-line">
                        {result.question}
                      </p>
                      <div className="mt-2 space-y-1 text-sm">
                        {!result.isCorrect && (
                          <p className="text-rose-600">
                            Your answer: {result.userAnswer || "No answer"}
                          </p>
                        )}
                        <p className="text-emerald-600">
                          Correct answer: {result.correctAnswer}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {result.explanation}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {result.points} pts
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-3">
          <Button variant="outline" onClick={exitQuiz} className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            Back to Quizzes
          </Button>
          {activeQuizId && (
            <Button
              onClick={() => {
                setActiveQuiz(null);
                setActiveQuizId(null);
                setQuizResult(null);
                startQuiz(activeQuizId);
              }}
              className="flex-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake Quiz
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Quiz List
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quizzes</h2>
          <p className="text-muted-foreground">
            Test your knowledge with auto-generated questions
          </p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Brain className="mr-2 h-4 w-4" />
          Generate New Quiz
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <HelpCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Quizzes Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Generate quizzes from your notes. StudyFlow creates multiple-choice, fill-in-the-blank,
              and true/false questions using rule-based NLP — no paid AI required!
            </p>
            <Button onClick={handleOpenDialog}>
              <Brain className="mr-2 h-4 w-4" />
              Generate Your First Quiz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{quiz.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-0.5">
                        <FileText className="h-3 w-3" />
                        {quiz.noteTitle}
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
                  <Badge variant="outline">{quiz.questionCount} Questions</Badge>
                  <Badge variant="outline">{quiz.totalPoints} Points</Badge>
                  {quiz.resultCount > 0 && (
                    <Badge variant="secondary">{quiz.resultCount} attempt{quiz.resultCount > 1 ? "s" : ""}</Badge>
                  )}
                </div>
                <Button className="w-full" onClick={() => startQuiz(quiz.id)}>
                  <Brain className="mr-2 h-4 w-4" />
                  {quiz.resultCount > 0 ? "Retake Quiz" : "Start Quiz"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Quiz</DialogTitle>
            <DialogDescription>
              Select a note and the number of questions. The AI will create multiple-choice,
              fill-in-the-blank, and true/false questions.
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
              <Label htmlFor="num-questions">Number of Questions</Label>
              <Input
                id="num-questions"
                type="number"
                min={3}
                max={20}
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value) || 10)}
              />
              <p className="text-xs text-muted-foreground">
                More questions = longer quiz. Recommended: 5-10.
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
                <Brain className="mr-2 h-4 w-4" />
              )}
              Generate &amp; Start Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
