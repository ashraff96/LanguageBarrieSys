import { useEffect, useMemo, useState } from "react";
import { apiService, RajabashaPaper, RajabashaQuestion } from "@/lib/services/api-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { 
  BookOpen, 
  FileText, 
  Edit, 
  Plus, 
  Play, 
  CheckCircle, 
  Target, 
  Brain,
  Trophy,
  Star,
  Loader2,
  Sparkles,
  Users,
  Clock,
  Award,
  ArrowRight,
  PenTool,
  Eye,
  Headphones
} from "lucide-react";

export default function Rajabasha() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [papers, setPapers] = useState<RajabashaPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<RajabashaPaper | null>(null);
  const [questions, setQuestions] = useState<RajabashaQuestion[]>([]);

  const [newPaper, setNewPaper] = useState({ title: "", description: "", language: "ta" });
  const [newQuestion, setNewQuestion] = useState({ question_text: "", question_type: "mcq" as "mcq" | "short", optionsRaw: "", answer_key: "", marks: 1 });
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const mcqOptions = useMemo(() => {
    if (!newQuestion.optionsRaw.trim()) return [] as Array<{ id: string; text: string }>;
    try {
      // optionsRaw format: id:text per line, e.g. A:Option A
      return newQuestion.optionsRaw.split("\n").map((line) => {
        const [id, ...rest] = line.split(":");
        return { id: id.trim(), text: rest.join(":").trim() };
      });
    } catch {
      return [] as Array<{ id: string; text: string }>;
    }
  }, [newQuestion.optionsRaw]);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const list = await apiService.getRajabashaPapers();
      setPapers(list);
    } catch (e) {
      toast({ title: "Failed to load papers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
  }, []);

  const openPaper = async (paper: RajabashaPaper) => {
    setSelectedPaper(paper);
    try {
      const qs = await apiService.getRajabashaQuestions(paper.id);
      setQuestions(qs);
      setAnswers({});
    } catch {
      toast({ title: "Failed to load questions", variant: "destructive" });
    }
  };

  const handleCreatePaper = async () => {
    if (!newPaper.title.trim()) return;
    setLoading(true);
    try {
      const created = await apiService.createRajabashaPaper({
        title: newPaper.title,
        description: newPaper.description || undefined,
        language: newPaper.language || undefined,
      });
      setNewPaper({ title: "", description: "", language: "ta" });
      await loadPapers();
      toast({ title: `Paper created: ${created.title}` });
    } catch {
      toast({ title: "Failed to create paper", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!selectedPaper) return;
    if (!newQuestion.question_text.trim()) return;
    setLoading(true);
    try {
      const payload: any = {
        question_text: newQuestion.question_text,
        question_type: newQuestion.question_type,
        marks: newQuestion.marks,
      };
      if (newQuestion.question_type === "mcq") {
        payload.options = mcqOptions;
        payload.answer_key = newQuestion.answer_key;
      } else {
        payload.answer_key = newQuestion.answer_key;
      }
      await apiService.createRajabashaQuestion(selectedPaper.id, payload);
      // reload questions
      const qs = await apiService.getRajabashaQuestions(selectedPaper.id);
      setQuestions(qs);
      setNewQuestion({ question_text: "", question_type: "mcq", optionsRaw: "", answer_key: "", marks: 1 });
      toast({ title: "Question added" });
    } catch {
      toast({ title: "Failed to add question", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!selectedPaper) return;
    setLoading(true);
    try {
      const res = await apiService.submitRajabashaAttempt(selectedPaper.id, answers);
      toast({ title: `Score: ${res.score}/${res.total}` });
    } catch {
      toast({ title: "Failed to submit attempt", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <div className="container mx-auto py-8 px-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Rajabasha Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create, practice, and master language papers with our comprehensive learning platform.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="papers" className="space-y-8">
            {/* Enhanced Tabs */}
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <TabsTrigger value="papers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Papers
                </TabsTrigger>
                <TabsTrigger value="practice" disabled={!selectedPaper} className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                  <Play className="w-4 h-4 mr-2" />
                  Practice
                </TabsTrigger>
                <TabsTrigger value="create" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Papers Tab */}
            <TabsContent value="papers" className="mt-8">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center justify-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    Available Papers
                  </CardTitle>
                  <p className="text-gray-600">Select a paper to start practicing or view details</p>
                </CardHeader>
                <CardContent>
                  {loading && (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                      <p className="mt-2 text-gray-600">Loading papers...</p>
                    </div>
                  )}
                  {!loading && papers.length === 0 && (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No papers available yet.</p>
                      <p className="text-gray-400">Create your first paper to get started!</p>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-6">
                    {papers.map((p) => (
                      <Card key={p.id} className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-r from-white to-gray-50">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-800 mb-2">{p.title}</h3>
                              <p className="text-gray-600 mb-3">{p.description || "No description available"}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{p.questions_count ?? 0} questions</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Target className="w-4 h-4" />
                                  <span className="uppercase">{p.language}</span>
                                </div>
                              </div>
                            </div>
                            <Button 
                              onClick={() => openPaper(p)}
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Open
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Practice Tab */}
            <TabsContent value="practice" className="mt-8">
              <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-semibold text-blue-800 flex items-center justify-center gap-3">
                    <Play className="w-6 h-6 text-blue-600" />
                    {selectedPaper ? selectedPaper.title : 'Select a Paper'}
                  </CardTitle>
                  {selectedPaper && (
                    <p className="text-blue-600">Language: {selectedPaper.language.toUpperCase()} • Questions: {questions.length}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {!selectedPaper && (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                      <p className="text-blue-600 text-lg">Select a paper from the Papers tab to start practicing.</p>
                    </div>
                  )}
                  {selectedPaper && (
                    <div className="space-y-6">
                      {questions.length === 0 && (
                        <div className="text-center py-8">
                          <PenTool className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No questions in this paper yet.</p>
                          <p className="text-gray-400 text-sm">Add questions in the Create tab to start practicing.</p>
                        </div>
                      )}
                      {questions.map((q, index) => (
                        <Card key={q.id} className="border-0 bg-white shadow-sm">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800 mb-4 text-lg">{q.question_text}</h4>
                                {q.question_type === 'mcq' ? (
                                  <div className="space-y-2">
                                    {(q.options || []).map((opt) => (
                                      <label key={opt.id} className="flex items-center gap-2">
                                        <input
                                          type="radio"
                                          name={`q-${q.id}`}
                                          value={opt.id}
                                          checked={answers[q.id] === opt.id}
                                          onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                        />
                                        <span>{opt.id}. {opt.text}</span>
                                      </label>
                                    ))}
                                  </div>
                                ) : (
                                  <Input
                                    placeholder="Your answer"
                                    value={answers[q.id] || ''}
                                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                  />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {questions.length > 0 && (
                        <Button onClick={handleSubmitAttempt} disabled={loading}>Submit</Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Create Tab */}
            <TabsContent value="create" className="mt-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Create Paper */}
                <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-2xl font-semibold text-blue-800 flex items-center justify-center gap-3">
                      <Plus className="w-6 h-6 text-blue-600" />
                      Create New Paper
                    </CardTitle>
                    <p className="text-blue-600">Set up a new practice paper for students</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Paper Title
                      </Label>
                      <Input 
                        value={newPaper.title} 
                        onChange={(e) => setNewPaper((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Enter paper title..."
                        className="h-12 text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Description
                      </Label>
                      <Input 
                        value={newPaper.description} 
                        onChange={(e) => setNewPaper((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Enter paper description..."
                        className="h-12 text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Language
                      </Label>
                      <Input 
                        value={newPaper.language} 
                        onChange={(e) => setNewPaper((p) => ({ ...p, language: e.target.value }))}
                        placeholder="e.g., ta, en, es..."
                        className="h-12 text-lg"
                      />
                    </div>
                    <Button 
                      onClick={handleCreatePaper} 
                      disabled={loading || !newPaper.title.trim()}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold border-0"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Paper
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Create Question */}
                <Card className="shadow-xl border-0 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-2xl font-semibold text-indigo-800 flex items-center justify-center gap-3">
                      <PenTool className="w-6 h-6 text-indigo-600" />
                      Add Question
                    </CardTitle>
                    <p className="text-indigo-600">
                      {selectedPaper ? `for ${selectedPaper.title}` : 'Select a paper first'}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!selectedPaper && (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
                        <p className="text-indigo-600">Select a paper in Papers tab first.</p>
                      </div>
                    )}
                    {selectedPaper && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Question Text
                          </Label>
                          <Input 
                            value={newQuestion.question_text} 
                            onChange={(e) => setNewQuestion((q) => ({ ...q, question_text: e.target.value }))}
                            placeholder="Enter your question..."
                            className="h-12 text-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            Question Type
                          </Label>
                          <select 
                            className="w-full h-12 text-lg border-2 border-gray-200 rounded-md focus:border-indigo-500 focus:outline-none px-3"
                            value={newQuestion.question_type} 
                            onChange={(e) => setNewQuestion((q) => ({ ...q, question_type: e.target.value as any }))}
                          >
                            <option value="mcq">Multiple Choice</option>
                            <option value="short">Short Answer</option>
                          </select>
                        </div>
                        {newQuestion.question_type === 'mcq' && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Options (one per line as id:text)
                              </Label>
                              <textarea 
                                className="w-full border-2 border-gray-200 rounded-md p-3 text-lg focus:border-indigo-500 focus:outline-none resize-none" 
                                rows={4} 
                                value={newQuestion.optionsRaw} 
                                onChange={(e) => setNewQuestion((q) => ({ ...q, optionsRaw: e.target.value }))}
                                placeholder="A:First option&#10;B:Second option&#10;C:Third option&#10;D:Fourth option"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Correct Answer (e.g., A)
                              </Label>
                              <Input 
                                value={newQuestion.answer_key} 
                                onChange={(e) => setNewQuestion((q) => ({ ...q, answer_key: e.target.value }))}
                                placeholder="Enter correct answer key..."
                                className="h-12 text-lg"
                              />
                            </div>
                          </>
                        )}
                        {newQuestion.question_type === 'short' && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Expected Answer
                            </Label>
                            <Input 
                              value={newQuestion.answer_key} 
                              onChange={(e) => setNewQuestion((q) => ({ ...q, answer_key: e.target.value }))}
                              placeholder="Enter expected answer..."
                              className="h-12 text-lg"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Marks
                          </Label>
                          <Input 
                            type="number" 
                            value={newQuestion.marks} 
                            onChange={(e) => setNewQuestion((q) => ({ ...q, marks: Number(e.target.value || 1) }))}
                            placeholder="1"
                            className="h-12 text-lg"
                          />
                        </div>
                        <Button 
                          onClick={handleCreateQuestion} 
                          disabled={loading || !newQuestion.question_text.trim()}
                          className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold border-0"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Question
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 