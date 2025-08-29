import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users as UsersIcon, 
  FileText, 
  Languages, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Database
} from "lucide-react";
import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiService, DashboardStats } from "@/lib/services/api-service";
import { useToast } from "@/hooks/use-toast";
import DatabaseDashboard from "./admin/Database";
import UsersPage from "./admin/Users";
import FilesPage from "./admin/Files";
import TranslationsPage from "./admin/Translations";
import { useAuth } from "@/contexts/AuthContext";

const Admin = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Verify admin access
  useEffect(() => {
    if (user && !user.roles?.some(role => role.name === 'admin')) {
      // Redirect non-admin users to dashboard
      window.location.href = '/dashboard';
      return;
    }
  }, [user]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard statistics",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [toast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "processing":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "failed":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800",
      processing: "bg-blue-100 text-blue-800", 
      failed: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex h-screen">
          <AdminSidebar />
          <div className="flex-1 overflow-auto">
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur">
              <div className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
                <SidebarTrigger />
              </div>
            </header>
            <main className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-lg">Loading admin dashboard...</p>
                <p className="text-sm text-muted-foreground mt-2">Please wait while we fetch system statistics</p>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!stats) {
    return (
      <SidebarProvider>
        <div className="flex h-screen">
          <AdminSidebar />
          <div className="flex-1 overflow-auto">
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur">
              <div className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
                <SidebarTrigger />
              </div>
            </header>
            <main className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full">
                  <AlertTriangle className="w-5 h-5" />
                  Admin Dashboard Error
                </div>
                <p className="text-lg text-red-600">Failed to load dashboard data</p>
                <p className="text-sm text-muted-foreground">Unable to fetch system statistics</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur">
            <div className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
              <SidebarTrigger />
            </div>
          </header>
          
          <Routes>
            <Route path="/" element={
              <main className="flex-1 p-6">
                <div className="space-y-6">
                  {/* Admin Verification Banner */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-800">Administrator Access Confirmed</h3>
                        <p className="text-sm text-blue-600">You have full access to system administration features</p>
                      </div>
                    </div>
                  </div>

                  {/* Header */}
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                      Welcome back, Administrator! Here's what's happening with your system.
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Admin Access Granted
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.total_users.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats.active_users} active users
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Translations</CardTitle>
                        <Languages className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.total_translations.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats.completed_translations} completed
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.total_storage_used}</div>
                        <p className="text-xs text-muted-foreground">
                          Total file storage
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Languages</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.active_languages}</div>
                        <p className="text-xs text-muted-foreground">
                          Supported languages
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>
                        Access common admin functions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="outline" className="h-20 flex-col gap-2">
                          <UsersIcon className="w-5 h-5" />
                          Manage Users
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                          <FileText className="w-5 h-5" />
                          View Files
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                          <Database className="w-5 h-5" />
                          Database
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                          <Settings className="w-5 h-5" />
                          Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Latest system activities and user actions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats.recent_activity && stats.recent_activity.length > 0 ? (
                          stats.recent_activity.map((activity: any, index: number) => (
                            <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{activity.user}</p>
                                <p className="text-sm text-muted-foreground">{activity.action}</p>
                                {activity.file && (
                                  <p className="text-xs text-muted-foreground">File: {activity.file}</p>
                                )}
                                {activity.language && (
                                  <p className="text-xs text-muted-foreground">Language: {activity.language}</p>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{activity.time}</div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            No recent activity
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>System Status</CardTitle>
                      <CardDescription>
                        Current system health and performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats.system_status && Object.entries(stats.system_status).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <Badge variant={value === 'operational' ? 'default' : 'destructive'}>
                              {value}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </main>
            } />
            <Route path="database" element={<DatabaseDashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="translations" element={<TranslationsPage />} />
          </Routes>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;