import { useState } from "react";
import { apiService, PracticeSession, PracticeAttemptResult } from "@/lib/services/api-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Mic, 
  PenTool, 
  Headphones, 
  Eye, 
  Play, 
  Target, 
  Brain,
  Trophy,
  Star,
  Loader2,
  CheckCircle,
  Sparkles
} from "lucide-react";

const LanguagePractice = () => {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [target, setTarget] = useState("en");
  const [mode, setMode] = useState<PracticeSession['mode']>("speaking");
  const [promptId, setPromptId] = useState("greeting-1");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<PracticeAttemptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const start = async () => {
    try {
      setLoading(true);
      const s = await apiService.practiceStartSession({ target_language: target, mode });
      setSession(s);
      setResult(null);
      toast({ title: "Session started" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Could not start session", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!session) {
      toast({ title: "Start session first" });
      return;
    }
    try {
      setLoading(true);
      const r = await apiService.practiceSubmitAttempt({ session_id: session.id, prompt_id: promptId, answer_text: answer });
      setResult(r);
      toast({ title: "Attempt scored", description: `Score: ${r.score}` });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Submit failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'speaking': return <Mic className="w-5 h-5" />;
      case 'writing': return <PenTool className="w-5 h-5" />;
      case 'reading': return <Eye className="w-5 h-5" />;
      case 'listening': return <Headphones className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'speaking': return 'from-blue-500 to-indigo-500';
      case 'writing': return 'from-indigo-500 to-purple-500';
      case 'reading': return 'from-blue-600 to-cyan-500';
      case 'listening': return 'from-purple-500 to-blue-600';
      default: return 'from-blue-500 to-slate-500';
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'speaking': return 'Speaking Practice';
      case 'writing': return 'Writing Practice';
      case 'reading': return 'Reading Practice';
      case 'listening': return 'Listening Practice';
      default: return 'Practice Mode';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Language Practice
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Master new languages through interactive practice sessions. Choose your mode and start improving your skills today.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          {/* Session Setup */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center justify-center gap-3">
                <Play className="w-6 h-6 text-blue-600" />
                Start Practice Session
              </CardTitle>
              <p className="text-gray-600">Configure your practice session and begin learning</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configuration Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Target Language */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    Target Language
                  </label>
                  <Input 
                    placeholder="e.g., en, es, fr, de" 
                    value={target} 
                    onChange={e => setTarget(e.target.value)}
                    className="h-12 text-center text-lg font-medium border-2 focus:border-blue-500"
                  />
                </div>

                {/* Practice Mode */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-600" />
                    Practice Mode
                  </label>
                  <select
                    value={mode}
                    onChange={e => setMode(e.target.value as any)}
                    className="w-full h-12 text-center text-lg font-medium border-2 border-gray-200 rounded-md focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="speaking">Speaking</option>
                    <option value="writing">Writing</option>
                    <option value="reading">Reading</option>
                    <option value="listening">Listening</option>
                  </select>
                </div>

                {/* Prompt ID */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Prompt ID
                  </label>
                  <Input 
                    placeholder="e.g., greeting-1" 
                    value={promptId} 
                    onChange={e => setPromptId(e.target.value)}
                    className="h-12 text-center text-lg font-medium border-2 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Mode Display */}
              <div className="text-center">
                <div className={`inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r ${getModeColor(mode)} rounded-full text-white font-semibold`}>
                  {getModeIcon(mode)}
                  {getModeLabel(mode)}
                </div>
              </div>

              {/* Start Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={start} 
                  disabled={loading}
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Starting Session...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start Practice Session
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Practice Area */}
          {session && (
            <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-semibold text-blue-800 flex items-center justify-center gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  Practice Session Active
                </CardTitle>
                <p className="text-blue-600">Session ID: {session.id}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Answer Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {getModeIcon(mode)}
                    Your Answer
                  </label>
                  <Textarea 
                    rows={6} 
                    placeholder={`Type your ${mode} practice answer here...`}
                    value={answer} 
                    onChange={e => setAnswer(e.target.value)}
                    className="text-lg border-2 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                  <Button 
                    onClick={submit} 
                    disabled={loading || !answer.trim()}
                    size="lg"
                    className="h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        <Trophy className="w-5 h-5 mr-2" />
                        Submit Answer
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Display */}
          {result && (
            <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-semibold text-blue-800 flex items-center justify-center gap-3">
                  <Star className="w-6 h-6 text-blue-600" />
                  Practice Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Score Display */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-4 px-8 py-6 bg-white rounded-2xl shadow-lg border border-blue-100">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{result.score}</div>
                      <div className="text-sm text-gray-600">Score</div>
                    </div>
                    <div className="w-px h-16 bg-gray-200"></div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600">100</div>
                      <div className="text-sm text-gray-600">Max Score</div>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-600" />
                    AI Feedback
                  </h3>
                  <div className="p-4 bg-indigo-50 rounded-lg text-gray-700 leading-relaxed">
                    {result.feedback}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Practice Modes Info */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <Card className="text-center p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Speaking</h3>
              <p className="text-gray-600 text-sm">Improve pronunciation and fluency</p>
            </Card>
            
            <Card className="text-center p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Writing</h3>
              <p className="text-gray-600 text-sm">Enhance grammar and vocabulary</p>
            </Card>
            
            <Card className="text-center p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Reading</h3>
              <p className="text-gray-600 text-sm">Build comprehension skills</p>
            </Card>
            
            <Card className="text-center p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Listening</h3>
              <p className="text-gray-600 text-sm">Develop auditory recognition</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguagePractice; 