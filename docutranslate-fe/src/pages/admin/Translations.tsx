import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiService, Translation, AdminTranslationStats } from "@/lib/services/api-service";
import { Activity, CheckCircle, Clock, FileText, Filter, Languages, Search, XCircle, ArrowLeft, ArrowRight } from "lucide-react";

export default function AdminTranslations() {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [stats, setStats] = useState<AdminTranslationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // filters & pagination
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [target, setTarget] = useState<string>('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTranslations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, source, target]);

  const fetchStats = async () => {
    try {
      const s = await apiService.getAdminTranslationStats();
      setStats(s);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTranslations = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.getAllTranslations({
        per_page: perPage,
        page,
        status: status || undefined,
        source_language: source || undefined,
        target_language: target || undefined,
      });
      // If backend returns wrapped paginator via ApiService.request, res is already normalized
      setTranslations(res.data || []);
      setTotal(res.total || 0);
      setLastPage(res.last_page || 1);
    } catch (error) {
      console.error('Error fetching translations:', error);
      toast({ title: 'Error', description: 'Failed to fetch translations', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (st: string) => {
    const variants: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      processing: "bg-blue-100 text-blue-800",
      failed: "bg-red-100 text-red-800",
    };
    return <Badge className={variants[st] || "bg-gray-100 text-gray-800"}>{st}</Badge>;
  };

  const getStatusIcon = (st: string) => {
    switch (st) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoading && translations.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Translations</h1>
            <p className="text-muted-foreground">Manage and review all translations</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading translations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Translations</h1>
          <p className="text-muted-foreground">Manage and review all translations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_translations || 0}</div>
            <p className="text-xs text-muted-foreground">All translations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed_translations || 0}</div>
            <p className="text-xs text-muted-foreground">Finished items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.processing_translations || 0}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failed_translations || 0}</div>
            <p className="text-xs text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter translations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="flex items-center gap-2 md:col-span-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search text or filename..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button variant="outline" onClick={() => { setPage(1); fetchTranslations(); }}>Apply</Button>
            </div>
            <div>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <Input placeholder="Source (e.g., en)" value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} />
            </div>
            <div>
              <Input placeholder="Target (e.g., es)" value={target} onChange={(e) => { setTarget(e.target.value); setPage(1); }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Translations</CardTitle>
          <CardDescription>All translations across the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source → Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {translations.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(t.status)}
                      <div className="text-sm">
                        <span className="font-medium">{t.source_language}</span>
                        <span className="mx-2">→</span>
                        <span className="font-medium">{t.target_language}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(t.status)}</TableCell>
                  <TableCell>{t.file_name || '-'}</TableCell>
                  <TableCell>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">Page {page} of {lastPage} · {total} items</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage}>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 