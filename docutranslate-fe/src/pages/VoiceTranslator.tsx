import { useState } from "react";
import { apiService, VoiceResult } from "@/lib/services/api-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePageNavigation } from "@/hooks/use-page-navigation";
import { getLanguageStyle, getLanguageClassName, getLanguageName } from "@/lib/language-utils";
import { theme } from "@/lib/theme";
import { 
  Mic, 
  Upload, 
  Languages, 
  Volume2, 
  Download, 
  Play, 
  FileAudio,
  AudioWaveform,
  Sparkles,
  Home,
  ArrowLeft
} from "lucide-react";

const VoiceTranslator = () => {
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState("en");
  const [source, setSource] = useState<string>("auto");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { navigateToHome, navigateAfterTaskCompletion } = usePageNavigation();

  const handleSubmit = async () => {
    if (!file) {
      toast({ 
        title: "Audio File Required", 
        description: "Please select an audio file to transcribe and translate.",
        variant: "destructive"
      });
      return;
    }
    try {
      setLoading(true);
      const data = await apiService.voiceTranscribeTranslate({ 
        file, 
        target_language: target, 
        source_language: source || undefined 
      });
      setResult(data);
      toast({ 
        title: "✨ Translation Complete!", 
        description: "Your voice has been successfully transcribed and translated. Redirecting to home in 3 seconds..." 
      });
      
      // Auto-redirect after successful translation
      navigateAfterTaskCompletion('voice-translation');
    } catch (e: any) {
      toast({ 
        title: "Translation Failed", 
        description: e?.message || "Unable to process your audio file. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.layout.page}`}>
      {/* Navigation Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={navigateToHome}
                className="text-blue-700 hover:text-blue-900 hover:bg-blue-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div className="text-sm text-blue-600">
                <span className="font-medium">Voice Translator</span>
                <span className="mx-2">•</span>
                <span>Transform speech into text and translate instantly</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigateToHome}
              className="text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 p-6">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Voice Translator
              </h1>
              <p className="text-blue-600 text-lg mt-2">
                Transcribe and translate your audio files with AI precision
              </p>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Powered by Education Depatment
          </div>
        </div>

        {/* Upload Section */}
        <Card className={`${theme.components.card} border-blue-200`}>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <CardTitle className="flex items-center gap-3 text-blue-800">
              <Upload className="w-6 h-6" />
              Upload Audio File
            </CardTitle>
            <p className="text-blue-600 text-sm mt-2">
              Select an audio file to transcribe and translate. Supports MP3, WAV, M4A, and more.
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="audio-file" className="text-blue-700 font-medium">
                Audio File
              </Label>
              <div className="relative">
                <Input
                  id="audio-file"
                  type="file"
                  accept="audio/*"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className={`${theme.components.input} file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4 file:font-medium hover:file:bg-blue-100`}
                />
                <FileAudio className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
              </div>
              {file && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <AudioWaveform className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-700 font-medium">{file.name}</span>
                  <span className="text-blue-500 text-sm">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>

            {/* Language Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="source-lang" className="text-blue-700 font-medium">
                  Source Language (Optional)
                </Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className={theme.components.select}>
                    <SelectValue placeholder="Auto-detect language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                    <SelectItem value="si">Sinhala (සිංහල)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-lang" className="text-blue-700 font-medium">
                  Target Language *
                </Label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger className={theme.components.select}>
                    <SelectValue placeholder="Select target language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                    <SelectItem value="si">Sinhala (සිංහල)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleSubmit}
                disabled={loading || !file}
                className={`${theme.components.button.primary} px-8 py-3 text-lg font-semibold min-w-[200px]`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Languages className="w-5 h-5 mr-3" />
                    Transcribe & Translate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Transcript Card */}
            <Card className={`${theme.components.card} border-green-200`}>
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                <CardTitle className="flex items-center gap-3 text-green-800">
                  <Volume2 className="w-6 h-6" />
                  Original Transcript
                </CardTitle>
                <p className="text-green-600 text-sm">
                  What was detected in your audio file
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-900 text-lg leading-relaxed">
                    {result.transcript}
                  </p>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play Audio
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Translation Card */}
            <Card className={`${theme.components.card} border-blue-200`}>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                <CardTitle className="flex items-center gap-3 text-blue-800">
                  <Languages className="w-6 h-6" />
                  Translated Text
                </CardTitle>
                <p className="text-blue-600 text-sm">
                  Translation in your selected target language
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p 
                    className={`text-blue-900 text-lg leading-relaxed ${getLanguageClassName(target)}`}
                    style={getLanguageStyle(target)}
                  >
                    {result.translation}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-blue-600">
                    Translated to: <span className="font-medium">{getLanguageName(target)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      Listen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons after Translation */}
            <Card className={`${theme.components.card} border-purple-200`}>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold text-purple-800">What would you like to do next?</h3>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => {
                        setResult(null);
                        setFile(null);
                        setSource("auto");
                        setTarget("en");
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      New Translation
                    </Button>
                    <Button
                      onClick={navigateToHome}
                      variant="outline"
                      className="text-blue-700 border-blue-300 hover:bg-blue-50 px-6 py-2"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your translation will be saved to your history automatically.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Section */}
        <Card className={`${theme.components.card} border-indigo-200`}>
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200">
            <CardTitle className="text-indigo-800">
              ✨ Features & Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-blue-800">High Accuracy</h3>
                <p className="text-blue-600 text-sm">
                  Advanced AI models ensure precise transcription and translation
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto">
                  <Languages className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-emerald-800">Multi-Language</h3>
                <p className="text-emerald-600 text-sm">
                  Support for 50+ languages with automatic detection
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-purple-800">Fast Processing</h3>
                <p className="text-purple-600 text-sm">
                  Quick turnaround time for all your audio files
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceTranslator; 