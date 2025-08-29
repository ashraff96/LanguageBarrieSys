import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, HardDrive, Server, Table as TableIcon, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { apiService, DatabaseStats } from "@/lib/services/api-service";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner, PageLoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Memoized stat card component for better performance
const StatCard = React.memo(({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  progressValue, 
  progressText 
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle: string;
  progressValue?: number;
  progressText?: string;
}) => (
  <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {progressValue !== undefined && (
        <>
          <Progress value={progressValue} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-2">{progressText}</p>
        </>
      )}
      <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
    </CardContent>
  </Card>
));

StatCard.displayName = 'StatCard';

// Memoized table row component
const TableRowMemo = React.memo(({ 
  tableName, 
  tableData 
}: {
  tableName: string;
  tableData: { records: number; size: string; last_updated: string };
}) => (
  <TableRow className="hover:bg-muted/50 transition-colors">
    <TableCell className="font-medium capitalize">
      {tableName.replace(/_/g, ' ')}
    </TableCell>
    <TableCell className="text-right">
      {new Intl.NumberFormat().format(tableData.records)}
    </TableCell>
    <TableCell className="text-right">{tableData.size}</TableCell>
    <TableCell className="text-right">
      {new Date(tableData.last_updated).toLocaleDateString()}
    </TableCell>
  </TableRow>
));

TableRowMemo.displayName = 'TableRowMemo';

export default function DatabaseDashboard() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Store user preferences in localStorage
  const [autoRefresh, setAutoRefresh] = useLocalStorage('db-auto-refresh', false);
  const [refreshInterval, setRefreshInterval] = useLocalStorage('db-refresh-interval', 30000);

  // Memoized format function
  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat().format(num);
  }, []);

  // Memoized storage percentage calculation
  const storagePercentage = useMemo(() => {
    if (!stats?.storage_used) return 0;
    // Extract numeric value from storage string (e.g., "2.5 GB" -> 2.5)
    const match = stats.storage_used.match(/(\d+\.?\d*)/);
    if (!match) return 0;
    const used = parseFloat(match[1]);
    // Assume total capacity (this could be made configurable)
    const total = 10; // 10 GB assumed total
    return Math.min(Math.round((used / total) * 100), 100);
  }, [stats?.storage_used]);

  // Memoized table stats for better performance
  const sortedTableStats = useMemo(() => {
    if (!stats?.table_stats) return [];
    return Object.entries(stats.table_stats).sort((a, b) => b[1].records - a[1].records);
  }, [stats?.table_stats]);

  const fetchDatabaseStats = useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
        const data = await apiService.getDatabaseStats();
        setStats(data);
      if (showToast) {
        toast({
          title: "Success",
          description: "Database statistics refreshed",
        });
      }
      } catch (error) {
        console.error("Error fetching database stats:", error);
        toast({
          title: "Error",
          description: "Failed to fetch database statistics",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      if (showToast) setIsRefreshing(false);
      }
  }, [toast]);

  useEffect(() => {
    fetchDatabaseStats();
  }, [fetchDatabaseStats]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDatabaseStats(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchDatabaseStats]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Database Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage your database performance and storage
        </p>
        <PageLoadingSpinner text="Loading database statistics..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Database Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage your database performance and storage
        </p>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-lg text-red-600">Failed to load database statistics</p>
            <Button 
              onClick={() => fetchDatabaseStats(true)} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
      <h1 className="text-3xl font-bold tracking-tight">Database Management</h1>
      <p className="text-muted-foreground">
        Monitor and manage your database performance and storage
      </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fetchDatabaseStats(true)}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            {isRefreshing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Translations"
          value={formatNumber(stats.total_translations)}
          icon={Database}
          subtitle="Records in database"
        />

        <StatCard
          title="Total Users"
          value={formatNumber(stats.total_users)}
          icon={Server}
          subtitle="Active accounts"
        />

        <StatCard
          title="Storage Used"
          value={stats.storage_used}
          icon={HardDrive}
          subtitle={`${storagePercentage}% of total capacity`}
          progressValue={storagePercentage}
          progressText={`${storagePercentage}% of total capacity`}
        />

        <StatCard
          title="Database Size"
          value={stats.database_size}
          icon={TableIcon}
          subtitle="Total size"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Tables</CardTitle>
          <CardDescription>
            Overview of all database tables and their statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Name</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTableStats.map(([tableName, tableData]) => (
                <TableRowMemo
                  key={tableName}
                  tableName={tableName}
                  tableData={tableData}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
