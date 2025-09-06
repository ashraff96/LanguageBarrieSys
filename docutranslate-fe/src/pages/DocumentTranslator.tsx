import React, { useState, useRef, useMemo, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Download, Languages, Zap, Menu, X, Mic, BookOpen, Settings, CheckCircle, Globe, ArrowRight, Sparkles, Loader2, FileUp, CheckCircle2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fileUploadService } from "@/lib/services/file-upload-service";
import { apiService } from "@/lib/services/api-service";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useDebounce } from "@/hooks/use-debounce";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Configure PDF.js worker
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";

// Memoized Navigation Component
const Navigation = React.memo(() => {
  return (
    <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white px-6 py-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-white/20 to-white/10 rounded-xl flex items-center justify-center">
            <Languages className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold">DocuTranslate</span>
        </div>
                
        <div className="hidden md:flex items-center space-x-8">
          <a href="/" className="hover:text-blue-100 transition-colors duration-200">Home</a>
          <a href="/voice-translator" className="flex items-center space-x-2 hover:text-blue-100 transition-colors duration-200">
            <Mic className="w-4 h-4" />
            <span>Voice Translator</span>
          </a>
                    
          <a href="/document-translator" className="flex items-center space-x-2 text-blue-100 border-b-2 border-blue-200 pb-1">
            <FileText className="w-4 h-4" />
            <span>Document Translator</span>
          </a>
          <a href="/language-practice" className="flex items-center space-x-2 hover:text-blue-100 transition-colors duration-200">
            <BookOpen className="w-4 h-4" />
            <span>Language Practice</span>
          </a>
          <a href="/admin" className="flex items-center space-x-2 hover:text-blue-100 transition-colors duration-200">
            <Settings className="w-4 h-4" />
            <span>Dashboard</span>
          </a>
        </div>
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';

// Memoized Language Selector Component
const LanguageSelector = React.memo(({ 
  label, 
  value, 
  onValueChange, 
  placeholder 
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
}) => (
  <div className="space-y-2">
    <Label htmlFor={label.toLowerCase()}>{label}</Label>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="si">Sinhala (සිංහල)</SelectItem>
        <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  </div>
));

LanguageSelector.displayName = 'LanguageSelector';

const DocumentTranslator = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("txt");
  const [notifications, setNotifications] = useState([]);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null);
  const [translationStatus, setTranslationStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store user preferences in localStorage
  const [preferredLanguages, setPreferredLanguages] = useLocalStorage('preferred-languages', {
    source: 'en',
    target: 'si'
  });

  // Debounced source text for better performance
  const debouncedSourceText = useDebounce(sourceText, 500);

  // Memoized language options
  const languageOptions = useMemo(() => [
    { value: "si", label: "Sinhala (සිංහල)" },
    { value: "ta", label: "Tamil (தமிழ்)" },
    { value: "en", label: "English" }
  ], []);

  // Memoized text area styling based on language
  const getTextAreaClassName = useCallback((language: string) => {
    const baseClasses = "min-h-[200px] text-base leading-relaxed resize-none border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200";
    
    if (language === "si") {
      return `${baseClasses} font-sinhala text-lg`;
    } else if (language === "ta") {
      return `${baseClasses} font-tamil text-lg`;
    }
    return baseClasses;
  }, []);

  // Memoized file size formatter
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Simple toast notification system
  const showToast = useCallback((title: string, description: string, type = "default") => {
    const id = Date.now();
    const newNotification = { id, title, description, type };
    setNotifications(prev => [...prev, newNotification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter((n: any) => n.id !== id));
    }, 4000);
  }, []);

  // Helper: extract text from PDF using pdfjs-dist
  const extractTextFromPDF = useCallback(async (pdfFile: File): Promise<string> => {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const loadingTask = (pdfjsLib as any).getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = "";
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => (item.str ?? ""))
        .join(" ");
      fullText += (pageNumber > 1 ? "\n\n" : "") + pageText;
    }
    return fullText.trim();
  }, []);

  // Handle file upload with transition
  const handleFileUpload = useCallback(async (selectedFile: File) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setTranslationStatus('uploading');

    try {
      // Extract text for display
      let extractedText = '';
      if (selectedFile.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(selectedFile);
        setSourceText(extractedText);
      } else {
        extractedText = await selectedFile.text();
        setSourceText(extractedText);
      }

      // Always upload file to backend (use default languages if not selected)
      try {
        const uploadedFile = await fileUploadService.uploadFile(
          selectedFile,
          sourceLanguage || 'en', // Default to English if not selected
          targetLanguage || 'es'  // Default to Spanish if not selected
        );
        setUploadedFile(uploadedFile);
        setUploadedFileId(uploadedFile?.id || null);
        if (sourceLanguage && targetLanguage) {
          showToast("File Uploaded", "File saved and ready for translation");
        } else {
          showToast("File Uploaded", "File saved - please select languages for translation");
        }
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        // Show detailed error message
        const errorMessage = uploadError.message || 'Failed to save file to server';
        showToast("Upload Error", errorMessage, "error");
      }
      
      setTranslationStatus('processing');
    } catch (error) {
      console.error('Error processing file:', error);
      setTranslationStatus('failed');
      showToast("Error", "Failed to process file", "error");
    }
  }, [extractTextFromPDF, showToast, sourceLanguage, targetLanguage]);

  // Handle file input change
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      startTransition(() => {
        // Use setTimeout to handle async operation without making transition function async
        setTimeout(() => {
          handleFileUpload(selectedFile);
        }, 0);
      });
    }
  }, [handleFileUpload]);

  // Handle translation with transition
  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim() || !sourceLanguage || !targetLanguage) {
      showToast("Missing Information", "Please fill in all required fields", "error");
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      showToast("Authentication Required", "Please login to use the translation feature", "error");
      return;
    }

    setIsLoading(true);
    setTranslationStatus('processing');

    try {
      startTransition(() => {
        // Use setTimeout to handle async operation without making transition function async
        setTimeout(async () => {
          try {
            // First, call the translation API
            const translationResponse = await fetch('http://127.0.0.1:8000/api/translate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                text: sourceText,
                source_language: sourceLanguage,
                target_language: targetLanguage,
              }),
            });

            if (!translationResponse.ok) {
              const errorText = await translationResponse.text();
              console.error('Translation API Error:', errorText);
              throw new Error(`Translation failed: ${translationResponse.statusText} - ${errorText}`);
            }

            const translationData = await translationResponse.json();
            console.log('Translation API Response:', translationData);
            
            const translatedText = translationData.data?.translated_text || translationData.translated_text;

            if (!translatedText) {
              console.error('No translated text in response:', translationData);
              throw new Error('No translated text received from API');
            }

            console.log('Setting translated text:', translatedText);
            setTranslatedText(translatedText);

            // Create translation record
            const translationRecord = {
              original_text: sourceText,
              translated_text: translatedText,
              source_language: sourceLanguage,
              target_language: targetLanguage,
              file_name: uploadedFile?.original_name || 'Unknown',
              file_type: uploadedFile?.file_type || 'text/plain',
              file_size: uploadedFile?.file_size || sourceText.length,
              metadata: {
                translation_method: 'document_translator',
                processed_at: new Date().toISOString()
              }
            };

            const createResponse = await fetch('http://localhost:8000/api/translations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify(translationRecord),
            });

            if (!createResponse.ok) {
              console.warn('Failed to create translation record:', createResponse.statusText);
            }

            // Update file status to translated if we have a file ID
            if (uploadedFileId) {
              const statusResponse = await fetch(`http://localhost:8000/api/files/${uploadedFileId}/status`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                body: JSON.stringify({
                  status: 'translated',
                  translation_accuracy: 95 // Default accuracy score
                }),
              });

              if (!statusResponse.ok) {
                console.warn('Failed to update file status:', statusResponse.statusText);
              }
            }

            setTranslationStatus('completed');
            showToast("Translation Complete", "Document translated successfully");
          } catch (error) {
            console.error('Translation error:', error);
            setTranslationStatus('failed');
            showToast("Translation Failed", error.message || "An error occurred during translation", "error");
          } finally {
            setIsLoading(false);
          }
        }, 0);
      });
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationStatus('failed');
      showToast("Translation Failed", "An error occurred during translation", "error");
      setIsLoading(false);
    }
  }, [sourceText, sourceLanguage, targetLanguage, showToast, uploadedFile, uploadedFileId, isAuthenticated, user]);

  // Handle download
  const handleDownload = useCallback(async () => {
    if (!translatedText) return;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/download-formatted', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: translatedText,
          format: downloadFormat,
          filename: `translation`
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const element = document.createElement('a');
        element.href = url;
        element.download = `translation.${downloadFormat}`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        window.URL.revokeObjectURL(url);
        
        showToast("Download Started", "Translation downloaded successfully");
      } else {
        // Try to get error message from response
        let errorMessage = 'Download failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If can't parse JSON, use default message
        }
        throw new Error(`Download failed (${response.status}): ${errorMessage}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      // Fallback to client-side generation for txt files only
      if (downloadFormat === 'txt') {
        const element = document.createElement('a');
        const file = new Blob([translatedText], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `translation.${downloadFormat}`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        showToast("Download Started", "Translation downloaded successfully");
      } else {
        // For PDF and DOC, show specific error since client-side generation is not available
        showToast("Download Failed", `Could not generate ${downloadFormat.toUpperCase()} file. Please try again or use TXT format.`, "error");
      }
    }
  }, [translatedText, downloadFormat, showToast]);

  // Update preferred languages when they change
  const handleSourceLanguageChange = useCallback((value: string) => {
    setSourceLanguage(value);
    setPreferredLanguages(prev => ({ ...prev, source: value }));
  }, [setPreferredLanguages]);

  const handleTargetLanguageChange = useCallback((value: string) => {
    setTargetLanguage(value);
    setPreferredLanguages(prev => ({ ...prev, target: value }));
  }, [setPreferredLanguages]);

  // Initialize languages from preferences
  React.useEffect(() => {
    if (preferredLanguages.source && preferredLanguages.target) {
      setSourceLanguage(preferredLanguages.source);
      setTargetLanguage(preferredLanguages.target);
    }
  }, [preferredLanguages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Document Translator
          </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Translate documents between Sinhala, Tamil, and English with AI-powered accuracy
          </p>
        </div>

          {/* Main Translation Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Source Language Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Source Language
              </CardTitle>
                <CardDescription>
                  Upload a document or enter text to translate
              </CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Upload Document</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                      ref={fileInputRef}
                  type="file"
                      accept=".pdf,.txt,.doc,.docx"
                      onChange={handleFileChange}
                  className="hidden"
                />
                      <Button 
                      onClick={() => fileInputRef.current?.click()}
                        variant="outline" 
                      className="w-full"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                        Choose File
                      </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      PDF, TXT, DOC, DOCX (Max 10MB)
                    </p>
                  </div>
                </div>

                {/* Language Selection */}
                <LanguageSelector
                  label="Source Language"
                  value={sourceLanguage}
                  onValueChange={handleSourceLanguageChange}
                  placeholder="Select source language"
                />

                {/* Source Text */}
                <div className="space-y-2">
                  <Label>Source Text</Label>
                  <Textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Enter text to translate or upload a document..."
                    className={getTextAreaClassName(sourceLanguage)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Target Language Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-green-600" />
                  Target Language
                </CardTitle>
                <CardDescription>
                  Select target language and view translation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Language Selection */}
                <LanguageSelector
                  label="Target Language"
                  value={targetLanguage}
                  onValueChange={handleTargetLanguageChange}
                  placeholder="Select target language"
                />

                {/* Translation Button */}
                <Button
                  onClick={handleTranslate}
                  disabled={!sourceText.trim() || !sourceLanguage || !targetLanguage || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  size="lg"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Translate Document
                </Button>

                {/* Translated Text */}
                <div className="space-y-2">
                  <Label>Translation</Label>
                  <Textarea
                    value={translatedText}
                    readOnly
                    placeholder="Translation will appear here..."
                    className={getTextAreaClassName(targetLanguage)}
                  />
                </div>

                {/* Download Section */}
                {translatedText && (
                  <div className="space-y-2">
                    <Label>Download Translation</Label>
                    <div className="flex gap-2">
                      <Select value={downloadFormat} onValueChange={setDownloadFormat}>
                        <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="txt">TXT</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="doc">DOC</SelectItem>
                      </SelectContent>
                    </Select>
                      <Button onClick={handleDownload} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Indicators */}
          {translationStatus !== 'idle' && (
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {translationStatus === 'uploading' && (
                      <LoadingSpinner size="sm" text="Processing file..." />
                    )}
                    {translationStatus === 'processing' && (
                      <LoadingSpinner size="sm" text="Translating..." />
                    )}
              {translationStatus === 'completed' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Translation completed</span>
                  </div>
                    )}
                    {translationStatus === 'failed' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <X className="h-5 w-5" />
                        <span>Translation failed</span>
                      </div>
                    )}
                  </div>
                </div>
            </CardContent>
            </Card>
          )}

          {/* Notifications */}
          <div className="fixed top-4 right-4 space-y-2 z-50">
            {notifications.map((notification: any) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg shadow-lg max-w-sm ${
                  notification.type === 'error' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-green-500 text-white'
                }`}
              >
                <h4 className="font-semibold">{notification.title}</h4>
                <p className="text-sm opacity-90">{notification.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentTranslator;