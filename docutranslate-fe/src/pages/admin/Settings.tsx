import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/services/api-service";
import { theme } from "@/lib/theme";
import { 
  Settings, 
  Database, 
  Globe, 
  Shield, 
  Bell, 
  Server,
  HardDrive,
  Cpu,
  Wifi,
  Eye,
  Save,
  RefreshCw
} from "lucide-react";

interface SystemSettings {
  general: {
    site_name: string;
    site_url: string;
    admin_email: string;
    timezone: string;
    language: string;
    maintenance_mode: boolean;
  };
  database: {
    backup_frequency: string;
    auto_cleanup: boolean;
    max_file_size: string;
    storage_limit: string;
  };
  security: {
    session_timeout: string;
    max_login_attempts: number;
    password_complexity: boolean;
    two_factor_auth: boolean;
  };
  notifications: {
    email_notifications: boolean;
    system_alerts: boolean;
    user_registration: boolean;
    translation_complete: boolean;
  };
}

const SettingsPage = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      site_name: "DocuTranslate",
      site_url: "https://docutranslate.com",
      admin_email: "admin@docutranslate.com",
      timezone: "UTC",
      language: "en",
      maintenance_mode: false,
    },
    database: {
      backup_frequency: "daily",
      auto_cleanup: true,
      max_file_size: "50MB",
      storage_limit: "10GB",
    },
    security: {
      session_timeout: "30",
      max_login_attempts: 5,
      password_complexity: true,
      two_factor_auth: false,
    },
    notifications: {
      email_notifications: true,
      system_alerts: true,
      user_registration: true,
      translation_complete: false,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    version: "2.1.0",
    php_version: "8.2.0",
    database_version: "SQLite 3.40.0",
    laravel_version: "11.0.0",
    storage_used: "2.3GB",
    uptime: "7 days, 14 hours",
  });

  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiService.getAdminSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSaveSettings = async (category: keyof SystemSettings) => {
    setIsLoading(true);
    try {
      await apiService.updateAdminSettings(category, settings[category]);
      
      toast({
        title: "Settings Saved",
        description: `${category.charAt(0).toUpperCase() + category.slice(1)} settings have been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemAction = async (action: string) => {
    setIsLoading(true);
    try {
      switch (action.toLowerCase()) {
        case 'database backup':
          const backupResult = await apiService.createDatabaseBackup();
          toast({
            title: "Backup Created",
            description: `Database backup created: ${backupResult.backup_path} (${backupResult.size})`,
          });
          break;
        case 'database optimization':
          await apiService.optimizeDatabase();
          toast({
            title: "Optimization Complete",
            description: "Database has been optimized successfully.",
          });
          break;
        case 'database cleanup':
          const cleanupResult = await apiService.cleanupDatabase();
          toast({
            title: "Cleanup Complete",
            description: `Database cleanup completed. Removed ${Object.values(cleanupResult.cleanup_results).reduce((a: any, b: any) => a + b, 0)} old records.`,
          });
          break;
        case 'cache clear':
          await apiService.clearCache();
          toast({
            title: "Cache Cleared",
            description: "Application caches have been cleared successfully.",
          });
          break;
        default:
          // Simulate other actions
          await new Promise(resolve => setTimeout(resolve, 2000));
          toast({
            title: `${action} Completed`,
            description: `System ${action.toLowerCase()} has been completed successfully.`,
          });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action.toLowerCase()}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-900">System Settings</h1>
          <p className="text-blue-700">
            Configure and manage your DocuTranslate system settings
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className={`${theme.components.card} border-0`}>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Globe className="w-5 h-5" />
                  General Settings
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Basic site configuration and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">Site Name</Label>
                    <Input
                      id="site_name"
                      value={settings.general.site_name}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, site_name: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site_url">Site URL</Label>
                    <Input
                      id="site_url"
                      value={settings.general.site_url}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, site_url: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Admin Email</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      value={settings.general.admin_email}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, admin_email: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={settings.general.timezone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Asia/Colombo">Asia/Colombo</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div>
                    <Label htmlFor="maintenance">Maintenance Mode</Label>
                    <p className="text-sm text-blue-600">Put the site in maintenance mode</p>
                  </div>
                  <Switch
                    id="maintenance"
                    checked={settings.general.maintenance_mode}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, maintenance_mode: checked }
                    }))}
                  />
                </div>

                <Button 
                  onClick={() => handleSaveSettings('general')} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save General Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Settings */}
          <TabsContent value="database" className="space-y-6">
            <Card className={`${theme.components.card} border-0`}>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Database className="w-5 h-5" />
                  Database Configuration
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Database backup, cleanup, and storage settings
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="backup_frequency">Backup Frequency</Label>
                    <Select value={settings.database.backup_frequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_file_size">Max File Size</Label>
                    <Select value={settings.database.max_file_size}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10MB">10MB</SelectItem>
                        <SelectItem value="50MB">50MB</SelectItem>
                        <SelectItem value="100MB">100MB</SelectItem>
                        <SelectItem value="500MB">500MB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div>
                    <Label htmlFor="auto_cleanup">Auto Cleanup</Label>
                    <p className="text-sm text-blue-600">Automatically clean old files and data</p>
                  </div>
                  <Switch
                    id="auto_cleanup"
                    checked={settings.database.auto_cleanup}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      database: { ...prev.database, auto_cleanup: checked }
                    }))}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Button 
                    onClick={() => handleSystemAction('Database Backup')} 
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <HardDrive className="w-4 h-4 mr-2" />
                    Backup Now
                  </Button>
                  <Button 
                    onClick={() => handleSystemAction('Database Optimization')} 
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <Cpu className="w-4 h-4 mr-2" />
                    Optimize
                  </Button>
                  <Button 
                    onClick={() => handleSystemAction('Database Cleanup')} 
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Cleanup
                  </Button>
                </div>

                <Button 
                  onClick={() => handleSaveSettings('database')} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Database Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className={`${theme.components.card} border-0`}>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Shield className="w-5 h-5" />
                  Security Configuration
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Authentication, session, and security policies
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session_timeout"
                      type="number"
                      value={settings.security.session_timeout}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, session_timeout: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                    <Input
                      id="max_login_attempts"
                      type="number"
                      value={settings.security.max_login_attempts}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, max_login_attempts: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div>
                      <Label htmlFor="password_complexity">Password Complexity</Label>
                      <p className="text-sm text-blue-600">Require strong passwords</p>
                    </div>
                    <Switch
                      id="password_complexity"
                      checked={settings.security.password_complexity}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, password_complexity: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div>
                      <Label htmlFor="two_factor_auth">Two-Factor Authentication</Label>
                      <p className="text-sm text-blue-600">Enable 2FA for enhanced security</p>
                    </div>
                    <Switch
                      id="two_factor_auth"
                      checked={settings.security.two_factor_auth}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, two_factor_auth: checked }
                      }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => handleSaveSettings('security')} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className={`${theme.components.card} border-0`}>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Configure system and user notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50">
                      <div>
                        <Label htmlFor={key}>{key.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}</Label>
                        <p className="text-sm text-blue-600">
                          {key === 'email_notifications' && 'Send email notifications for system events'}
                          {key === 'system_alerts' && 'Show system alerts and warnings'}
                          {key === 'user_registration' && 'Notify admins of new user registrations'}
                          {key === 'translation_complete' && 'Notify users when translations are complete'}
                        </p>
                      </div>
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, [key]: checked }
                        }))}
                      />
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => handleSaveSettings('notifications')} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Info */}
          <TabsContent value="system" className="space-y-6">
            <Card className={`${theme.components.card} border-0`}>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Server className="w-5 h-5" />
                  System Information
                </CardTitle>
                <CardDescription className="text-blue-600">
                  View system status and perform maintenance tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {Object.entries(systemInfo).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 border border-blue-200 rounded-lg bg-blue-50">
                      <span className="text-sm font-medium text-blue-800 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-blue-600">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => handleSystemAction('Cache Clear')} 
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Cache
                  </Button>
                  <Button 
                    onClick={() => handleSystemAction('System Restart')} 
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <Wifi className="w-4 h-4 mr-2" />
                    Restart Services
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default SettingsPage;
