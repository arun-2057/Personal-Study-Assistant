"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthHeaders } from "@/store/auth";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  FileUp,
  Trash2,
  Sparkles,
  BookOpen,
  Tags,
  CalendarDays,
  ChevronRight,
  Eye,
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  fileType: string;
  topics: { term: string; score: number; count: number }[];
  createdAt: string;
  _count: { quizzes: number; studyPlans: number };
}

interface Topic {
  term: string;
  score: number;
  count: number;
}

interface NotesViewProps {
  onGeneratePlan?: (noteId: string) => void;
  onGenerateQuiz?: (noteId: string) => void;
}

export function NotesView({ onGeneratePlan, onGenerateQuiz }: NotesViewProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Upload form
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const res = await fetch("/api/notes", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your note");
      return;
    }
    if (!textContent.trim() && !file) {
      toast.error("Please enter text content or upload a file");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      if (textContent.trim()) {
        formData.append("textContent", textContent);
      }
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      toast.success(`Note "${title}" uploaded successfully!`);
      setShowUpload(false);
      setTitle("");
      setTextContent("");
      setFile(null);
      loadNotes();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/notes/${deleteId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Note deleted");
      setDeleteId(null);
      if (selectedNote?.id === deleteId) setSelectedNote(null);
      loadNotes();
    } catch {
      toast.error("Failed to delete note");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">My Notes</h2>
            <p className="text-muted-foreground">Manage your study materials</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Notes</h2>
          <p className="text-muted-foreground">
            {notes.length === 0
              ? "No notes yet. Upload your first study material."
              : `${notes.length} note${notes.length !== 1 ? "s" : ""} uploaded`}
          </p>
        </div>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Study Note</DialogTitle>
              <DialogDescription>
                Upload a PDF file or paste your text content below. Topics will be extracted automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  placeholder="e.g., Chapter 5: Machine Learning Basics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload File (optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {file ? (
                      <>
                        <FileText className="h-8 w-8 text-primary" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </>
                    ) : (
                      <>
                        <FileUp className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload PDF or TXT
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    or paste text
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note-text">Text Content</Label>
                <Textarea
                  id="note-text"
                  placeholder="Paste your study notes here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload & Extract Topics"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Notes Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Upload your first study note to get started. StudyFlow will automatically extract key topics
              and help you create quizzes and study plans.
            </p>
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Your First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <Card key={note.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{note.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-0.5">
                        <span className="capitalize">{note.fileType}</span>
                        <span>•</span>
                        <CalendarDays className="h-3 w-3" />
                        {new Date(note.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {note._count.quizzes > 0 ? `${note._count.quizzes} quiz${note._count.quizzes > 1 ? "zes" : ""}` : "No quizzes"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Topics Preview */}
                <div className="flex items-start gap-2">
                  <Tags className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex flex-wrap gap-1.5">
                    {(note.topics || []).slice(0, 5).map((t, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-normal">
                        {t.term}
                      </Badge>
                    ))}
                    {(note.topics || []).length > 5 && (
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                        +{(note.topics || []).length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content Preview */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {note.content.substring(0, 150)}...
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedNote(note)}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onGeneratePlan?.(note.id)}
                    disabled={note.topics.length === 0}
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Study Plan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onGenerateQuiz?.(note.id)}
                  >
                    <ChevronRight className="mr-1.5 h-3.5 w-3.5" />
                    Quiz
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(note.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Note Detail Dialog */}
      <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedNote?.title}</DialogTitle>
            <DialogDescription>
              Uploaded {selectedNote ? new Date(selectedNote.createdAt).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-6">
              {/* Topics */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Tags className="h-4 w-4" />
                  Extracted Topics ({selectedNote.topics.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedNote.topics.map((t, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="py-1 px-3"
                    >
                      {t.term}
                      <span className="ml-1.5 text-xs opacity-60">
                        (score: {t.score.toFixed(0)})
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Full Content
                </h4>
                <ScrollArea className="h-[300px] rounded-lg border p-4">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                    {selectedNote.content}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this note and all associated quizzes and study plans. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
