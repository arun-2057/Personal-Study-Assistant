"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { AuthForm } from "@/components/study-assistant/auth-form";
import { DashboardView } from "@/components/study-assistant/dashboard-view";
import { NotesView } from "@/components/study-assistant/notes-view";
import { StudyPlanView } from "@/components/study-assistant/study-plan-view";
import { QuizView } from "@/components/study-assistant/quiz-view";
import { ResultsView } from "@/components/study-assistant/results-view";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Brain,
  BarChart3,
  LogOut,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";

type TabValue = "dashboard" | "notes" | "plans" | "quizzes" | "results";

export default function Home() {
  const { user, isLoading, checkSession, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabValue>("dashboard");
  const [targetNoteForPlan, setTargetNoteForPlan] = useState<string | null>(null);
  const [targetNoteForQuiz, setTargetNoteForQuiz] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Handle note action callbacks
  const handleGeneratePlan = (noteId: string) => {
    setTargetNoteForPlan(noteId);
    setActiveTab("plans");
  };

  const handleGenerateQuiz = (noteId: string) => {
    setTargetNoteForQuiz(noteId);
    setActiveTab("quizzes");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 animate-pulse text-muted-foreground" />
          <Skeleton className="h-6 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Auth screen
  if (!user) {
    return <AuthForm />;
  }

  const tabs: { value: TabValue; label: string; icon: React.ReactNode }[] = [
    { value: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { value: "notes", label: "Notes", icon: <FileText className="h-4 w-4" /> },
    { value: "plans", label: "Study Plans", icon: <CalendarDays className="h-4 w-4" /> },
    { value: "quizzes", label: "Quizzes", icon: <Brain className="h-4 w-4" /> },
    { value: "results", label: "Results", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "notes":
        return (
          <NotesView
            onGeneratePlan={handleGeneratePlan}
            onGenerateQuiz={handleGenerateQuiz}
          />
        );
      case "plans":
        return (
          <StudyPlanView
            targetNoteId={targetNoteForPlan}
            onClearTarget={() => setTargetNoteForPlan(null)}
          />
        );
      case "quizzes":
        return (
          <QuizView
            targetNoteId={targetNoteForQuiz}
            onClearTarget={() => setTargetNoteForQuiz(null)}
          />
        );
      case "results":
        return <ResultsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-semibold text-lg hidden sm:inline">StudyFlow</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.value)}
                className="gap-1.5"
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-medium">{user.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="container mx-auto px-4 py-2">
              <nav className="flex flex-col gap-1">
                {tabs.map((tab) => (
                  <Button
                    key={tab.value}
                    variant={activeTab === tab.value ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setActiveTab(tab.value);
                      setMobileMenuOpen(false);
                    }}
                    className="justify-start gap-2"
                  >
                    {tab.icon}
                    {tab.label}
                  </Button>
                ))}
              </nav>
              <div className="mt-2 pt-2 border-t flex items-center gap-2 text-sm px-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{user.name}</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 mt-auto">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            StudyFlow — Free, offline-first personal study assistant
          </p>
          <p className="text-xs">
            No paid APIs • All NLP runs locally • Your data stays private
          </p>
        </div>
      </footer>
    </div>
  );
}
