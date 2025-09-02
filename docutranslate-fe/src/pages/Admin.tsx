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
  Database,
  RefreshCw
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
import { theme } from "@/lib/theme";

const Admin = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
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

  const fetchDashboardStats = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      // Add cache-busting timestamp
      const timestamp = new Date().getTime();
      const data = await apiService.getDashboardStats();
      
      console.log('Dashboard stats fetched at:', new Date().toISOString(), data);
      
      // Check for new activity
      const currentActivityCount = data.recent_activity?.length || 0;
      if (previousActivityCount > 0 && currentActivityCount > previousActivityCount) {
        toast({
          title: "🔔 New Activity Detected",
          description: `${currentActivityCount - previousActivityCount} new activities found`,
        });
      } else if (showRefreshIndicator && currentActivityCount > 0) {
        toast({
          title: "✅ Data Refreshed",
          description: `${currentActivityCount} activities loaded`,
        });
      }
      setPreviousActivityCount(currentActivityCount);
      
      setStats(data);
      setLastRefreshTime(new Date());
      
      if (showRefreshIndicator) {
        toast({
          title: "Success", 
          description: `Dashboard statistics refreshed at ${new Date().toLocaleTimeString()}`,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Auto-refresh every 10 seconds (more frequent for better real-time updates)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardStats(false);
    }, 10000); // Changed from 15 seconds to 10 seconds

    return () => clearInterval(interval);
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
        <div className={`flex h-screen ${theme.layout.page}`}>
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
        <div className={`flex h-screen ${theme.layout.page}`}>
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
      <div className={`flex h-screen ${theme.layout.page}`}>
        <AdminSidebar />
        <div className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-blue-200">
            <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight text-blue-900">Admin Dashboard</h1>
                      <p className="text-blue-700">
                        Welcome back, Administrator! Here's what's happening with your system.
                      </p>
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Admin Access Granted
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-blue-600 space-y-1">
                        {stats?.last_updated && (
                          <div>Last updated: {new Date(stats.last_updated).toLocaleTimeString()}</div>
                        )}
                        {lastRefreshTime && (
                          <div>Client refresh: {lastRefreshTime.toLocaleTimeString()}</div>
                        )}
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Auto-refresh every 15s</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => fetchDashboardStats(true)}
                        disabled={isRefreshing}
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        {isRefreshing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="ml-2">Quick Refresh</span>
                      </Button>
                      <Button
                        onClick={() => {
                          // Force complete data refresh
                          setStats(null);
                          setIsLoading(true);
                          setTimeout(() => {
                            fetchDashboardStats(true);
                          }, 100);
                        }}
                        variant="outline"
                        size="sm"
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span className="ml-2">Force Refresh All</span>
                      </Button>
                      <Button
                        onClick={() => {
                          // Force complete page reload to clear all cache
                          window.location.reload();
                        }}
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span className="ml-2">Force Page Reload</span>
                      </Button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className={`${theme.components.card} hover:shadow-xl transition-all duration-300 border-0`}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                        <CardTitle className="text-sm font-medium text-blue-800">Total Users</CardTitle>
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <UsersIcon className="h-4 w-4 text-blue-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-blue-900">{stats.total_users.toLocaleString()}</div>
                        <p className="text-xs text-blue-600">
                          {stats.active_users} active users
                        </p>
                      </CardContent>
                    </Card>

                    <Card className={`${theme.components.card} hover:shadow-xl transition-all duration-300 border-0`}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                        <CardTitle className="text-sm font-medium text-blue-800">Total Translations</CardTitle>
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Languages className="h-4 w-4 text-blue-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-blue-900">{stats.total_translations.toLocaleString()}</div>
                        <p className="text-xs text-blue-600">
                          {stats.completed_translations} completed
                        </p>
                      </CardContent>
                    </Card>

                    <Card className={`${theme.components.card} hover:shadow-xl transition-all duration-300 border-0`}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                        <CardTitle className="text-sm font-medium text-blue-800">Storage Used</CardTitle>
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-blue-900">{stats.total_storage_used}</div>
                        <p className="text-xs text-blue-600">
                          Total file storage
                        </p>
                      </CardContent>
                    </Card>

                    <Card className={`${theme.components.card} hover:shadow-xl transition-all duration-300 border-0`}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                        <CardTitle className="text-sm font-medium text-blue-800">Active Languages</CardTitle>
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-blue-900">{stats.active_languages}</div>
                        <p className="text-xs text-blue-600">
                          Supported languages
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card className={`${theme.components.card} hover:shadow-xl transition-all duration-300 border-0`}>
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                      <CardTitle className="text-blue-800">Quick Actions</CardTitle>
                      <CardDescription className="text-blue-600">
                        Access common admin functions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button 
                          variant="outline" 
                          className={`h-20 flex-col gap-2 ${theme.components.button.outline}`}
                          onClick={() => window.location.href = '/admin/users'}
                        >
                          <UsersIcon className="w-5 h-5" />
                          Manage Users
                        </Button>
                        <Button 
                          variant="outline" 
                          className={`h-20 flex-col gap-2 ${theme.components.button.outline}`}
                          onClick={() => window.location.href = '/admin/files'}
                        >
                          <FileText className="w-5 h-5" />
                          View Files
                        </Button>
                        <Button 
                          variant="outline" 
                          className={`h-20 flex-col gap-2 ${theme.components.button.outline}`}
                          onClick={() => window.location.href = '/admin/database'}
                        >
                          <Database className="w-5 h-5" />
                          Database
                        </Button>
                        <Button 
                          variant="outline" 
                          className={`h-20 flex-col gap-2 ${theme.components.button.outline}`}
                          onClick={() => window.location.href = '/admin/settings'}
                        >
                          <Settings className="w-5 h-5" />
                          Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className={`${theme.components.card} hover:shadow-xl transition-all duration-300 border-0`}>
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                      <CardTitle className="text-blue-800 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          Recent Activity
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </span>
                        <span className="text-xs font-normal text-blue-600 flex items-center gap-2">
                          <span>Auto-refresh every 10s</span>
                          {lastRefreshTime && (
                            <span>| Updated: {lastRefreshTime.toLocaleTimeString()}</span>
                          )}
                        </span>
                      </CardTitle>
                      <CardDescription className="text-blue-600">
                        Latest system activities and user actions
                        {stats.recent_activity && (
                          <span className="ml-2 text-xs">({stats.recent_activity.length} activities)</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {stats.recent_activity && stats.recent_activity.length > 0 ? (
                          stats.recent_activity.map((activity: any, index: number) => (
                            <div key={index} className="flex items-center gap-4 p-3 rounded-lg border border-blue-200 bg-blue-50">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-blue-800">{activity.user}</p>
                                <p className="text-sm text-blue-600">{activity.action}</p>
                                {activity.file && (
                                  <p className="text-xs text-blue-500">File: {activity.file}</p>
                                )}
                                {activity.language && (
                                  <p className="text-xs text-blue-500">Language: {activity.language}</p>
                                )}
                              </div>
                              <div className="text-xs text-blue-500">{activity.time}</div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-blue-500 py-8">
                            No recent activity
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Status */}
                  <Card className={`${theme.components.card} hover:shadow-xl transition-all duration-300 border-0`}>
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                      <CardTitle className="text-blue-800">System Status</CardTitle>
                      <CardDescription className="text-blue-600">
                        Current system health and performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {stats.system_status && Object.entries(stats.system_status).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-blue-200 bg-blue-50">
                            <span className="text-sm font-medium capitalize text-blue-800">
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
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;