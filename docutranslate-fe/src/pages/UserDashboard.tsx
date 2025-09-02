import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle, 
  BarChart3, 
  History,
  Activity,
  Languages,
  User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fileUploadService, UploadedFile } from "@/lib/services/file-upload-service";
import { apiService } from "@/lib/services/api-service";

export default function UserDashboard() {
  const { user } = useAuth();
  const [userFiles, setUserFiles] = useState<UploadedFile[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [filesResponse, statsResponse, activityResponse] = await Promise.all([
        fileUploadService.getUploadedFiles({ user_id: user?.id, per_page: 50 }),
        fileUploadService.getFileStats(),
        apiService.getUserTranslations({ per_page: 10 })
      ]);

      setUserFiles(filesResponse.data);
      setUserStats(statsResponse);
      setRecentActivity(activityResponse.data || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  // Refresh data when returning to the page
  useEffect(() => {
    const handleFocus = () => {
      if (user && !isLoading) {
        fetchUserData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, isLoading, fetchUserData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploaded":
        return <Upload className="w-4 h-4 text-blue-600" />;
      case "processing":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "translated":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      uploaded: "bg-blue-100 text-blue-800",
      processing: "bg-yellow-100 text-yellow-800",
      translated: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    
    return <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
      {status}
    </Badge>;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const userFileStats = {
    total: userFiles.length,
    uploaded: userFiles.filter(f => f.status === 'uploaded').length,
    processing: userFiles.filter(f => f.status === 'processing').length,
    translated: userFiles.filter(f => f.status === 'translated').length,
    failed: userFiles.filter(f => f.status === 'failed').length,
    averageAccuracy: userFiles
      .filter(f => f.translation_accuracy)
      .reduce((acc, f) => acc + (f.translation_accuracy || 0), 0) / 
      Math.max(userFiles.filter(f => f.translation_accuracy).length, 1)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">
            Here's an overview of your translation activities
          </p>
        </div>
        <Button onClick={() => window.location.href = '/document-translator'}>
          <Upload className="mr-2 h-4 w-4" />
          Upload New Document
        </Button>
      </div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userFileStats.total}</div>
            <p className="text-xs text-muted-foreground">Uploaded files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userFileStats.processing}</div>
            <p className="text-xs text-muted-foreground">In translation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Translation Accuracy</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userFileStats.averageAccuracy ? `${userFileStats.averageAccuracy.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">Average accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userFileStats.total > 0 
                ? `${Math.round((userFileStats.translated / userFileStats.total) * 100)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">Successful translations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Recent Documents
            </CardTitle>
            <CardDescription>
              Your latest uploaded files and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userFiles.slice(0, 5).map((file) => (
                <div key={file.id} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg">
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {file.original_name}
                      </p>
                      {getStatusBadge(file.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {file.source_language} → {file.target_language} • {formatFileSize(file.file_size)}
                    </p>
                    {file.translation_accuracy && (
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={file.translation_accuracy} className="w-16 h-2" />
                        <span className="text-xs text-muted-foreground">
                          {file.translation_accuracy}% accuracy
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {userFiles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No documents uploaded yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.href = '/document-translator'}
                  >
                    Upload Your First Document
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest translation activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <History className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {activity.action || 'Translation activity'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.source_language} → {activity.target_language}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Language Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-primary" />
            Language Usage
          </CardTitle>
          <CardDescription>
            Your most used language combinations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const languageStats = userFiles.reduce((acc, file) => {
                const key = `${file.source_language} → ${file.target_language}`;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              const topLanguages = Object.entries(languageStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 4);

              return topLanguages.map(([languages, count]) => (
                <div key={languages} className="text-center p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm font-medium">{languages}</p>
                  <p className="text-2xl font-bold text-primary">{count}</p>
                  <p className="text-xs text-muted-foreground">translations</p>
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 