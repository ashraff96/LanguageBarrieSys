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
import SettingsPage from "./admin/Settings";
import { useAuth } from "@/contexts/AuthContext";

const Admin = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previousActivityCount, setPreviousActivityCount] = useState<number>(0);
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

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const stats = await apiService.getDashboardStats();
      setStats(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      toast({
        title: "Error", 
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once on mount
    fetchDashboardStats();
  }, []);

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
        <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
          <AdminSidebar />
          <div className="flex-1 overflow-auto">
            <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-blue-200">
              <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
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
        <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
          <AdminSidebar />
          <div className="flex-1 overflow-auto">
            <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-blue-200">
              <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
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
      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
        <AdminSidebar />
        <div className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-blue-200">
            <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
              <SidebarTrigger />
            </div>
          </header>
          
          <Routes>
            <Route path="/" element={
              <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8">
                <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
                  {/* Admin Verification Banner */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-blue-800 text-sm sm:text-base">Administrator Access Confirmed</h3>
                        <p className="text-xs sm:text-sm text-blue-600">You have full access to system administration features</p>
                      </div>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                    <div className="space-y-3">
                      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-blue-900">Admin Dashboard</h1>
                      <p className="text-sm lg:text-base text-blue-700 max-w-2xl">
                        Welcome back, Administrator! Here's what's happening with your system.
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs lg:text-sm font-medium">
                        <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4" />
                        Admin Access Granted
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="hover:shadow-xl transition-all duration-300 border border-blue-200 hover:border-blue-300 bg-gradient-to-br from-white to-blue-50/30">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                        <CardTitle className="text-xs sm:text-sm font-semibold text-blue-800">Total Users</CardTitle>
                        <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg shadow-sm">
                          <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 sm:pt-6">
                        <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">{stats.total_users.toLocaleString()}</div>
                        <p className="text-xs sm:text-sm text-blue-600 font-medium">
                          {stats.active_users} active users
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-xl transition-all duration-300 border border-blue-200 hover:border-blue-300 bg-gradient-to-br from-white to-blue-50/30">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                        <CardTitle className="text-xs sm:text-sm font-semibold text-blue-800">Total Translations</CardTitle>
                        <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg shadow-sm">
                          <Languages className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 sm:pt-6">
                        <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">{stats.total_translations.toLocaleString()}</div>
                        <p className="text-xs sm:text-sm text-blue-600 font-medium">
                          {stats.completed_translations} completed
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-xl transition-all duration-300 border border-blue-200 hover:border-blue-300 bg-gradient-to-br from-white to-blue-50/30">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                        <CardTitle className="text-xs sm:text-sm font-semibold text-blue-800">Storage Used</CardTitle>
                        <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg shadow-sm">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 sm:pt-6">
                        <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">{stats.total_storage_used}</div>
                        <p className="text-xs sm:text-sm text-blue-600 font-medium">
                          Total file storage
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-xl transition-all duration-300 border border-blue-200 hover:border-blue-300 bg-gradient-to-br from-white to-blue-50/30">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                        <CardTitle className="text-xs sm:text-sm font-semibold text-blue-800">Active Languages</CardTitle>
                        <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg shadow-sm">
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 sm:pt-6">
                        <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">{stats.active_languages}</div>
                        <p className="text-xs sm:text-sm text-blue-600 font-medium">
                          Supported languages
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card className="hover:shadow-lg transition-shadow duration-200 border border-blue-200">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="text-blue-800">Quick Actions</CardTitle>
                      <CardDescription className="text-blue-600">
                        Access common admin functions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 sm:pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <Button 
                          variant="outline" 
                          className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
                          onClick={() => window.location.href = '/admin/users'}
                        >
                          <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          Manage Users
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
                          onClick={() => window.location.href = '/admin/files'}
                        >
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                          View Files
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
                          onClick={() => window.location.href = '/admin/database'}
                        >
                          <Database className="w-4 h-4 sm:w-5 sm:h-5" />
                          Database
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
                          onClick={() => window.location.href = '/admin/settings'}
                        >
                          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                          Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="hover:shadow-lg transition-shadow duration-200 border border-blue-200">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="text-sm sm:text-base text-blue-800">
                        <span className="flex items-center gap-2">
                          Recent Activity
                        </span>
                      </CardTitle>
                      <CardDescription className="text-blue-600">
                        Latest system activities and user actions
                        {stats.recent_activity && (
                          <span className="ml-2 text-xs">({stats.recent_activity.length} activities)</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 sm:pt-6">
                      <div className="space-y-3 sm:space-y-4">
                        {stats.recent_activity && stats.recent_activity.length > 0 ? (
                          stats.recent_activity.map((activity: any, index: number) => (
                            <div key={index} className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 rounded-lg border border-blue-200 bg-blue-50">
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1 sm:mt-0"></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-blue-800 truncate">{activity.user}</p>
                                <p className="text-xs sm:text-sm text-blue-600 break-words">{activity.action}</p>
                                {activity.file && (
                                  <p className="text-xs text-blue-500 truncate">File: {activity.file}</p>
                                )}
                                {activity.language && (
                                  <p className="text-xs text-blue-500">Language: {activity.language}</p>
                                )}
                              </div>
                              <div className="text-xs text-blue-500 flex-shrink-0">{activity.time}</div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-blue-500 py-6 sm:py-8 text-sm">
                            No recent activity
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Status */}
                  <Card className="hover:shadow-lg transition-shadow duration-200 border border-blue-200">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="text-blue-800">System Status</CardTitle>
                      <CardDescription className="text-blue-600">
                        Current system health and performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 sm:pt-6">
                      <div className="space-y-3 sm:space-y-4">
                        {stats.system_status && Object.entries(stats.system_status).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-blue-200 bg-blue-50">
                            <span className="text-xs sm:text-sm font-medium capitalize text-blue-800 truncate pr-2">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <Badge variant={value === 'operational' ? 'default' : 'destructive'} className="text-xs flex-shrink-0">
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
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;