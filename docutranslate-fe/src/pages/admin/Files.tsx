import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  MoreVertical,
  Download,
  Trash,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  BarChart3,
  HardDrive,
  Languages,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fileUploadService, UploadedFile } from "@/lib/services/file-upload-service";

export default function Files() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [fileStats, setFileStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchFiles();
    fetchFileStats();
  }, []);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fileUploadService.getUploadedFiles({ per_page: 100 });
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to fetch uploaded files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFileStats = async () => {
    try {
      const stats = await fileUploadService.getFileStats();
      setFileStats(stats);
    } catch (error) {
      console.error('Error fetching file stats:', error);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (confirm("Are you sure you want to delete this file?")) {
      try {
        await fileUploadService.deleteFile(fileId);
        toast({
          title: "Success",
          description: "File deleted successfully",
        });
        fetchFiles();
        fetchFileStats();
      } catch (error) {
        console.error('Error deleting file:', error);
        toast({
          title: "Error",
          description: "Failed to delete file",
          variant: "destructive",
        });
      }
    }
  };

  const handleStatusChange = async (fileId: number, newStatus: string) => {
    try {
      await fileUploadService.updateFileStatus(fileId, newStatus);
      toast({
        title: "Success",
        description: "File status updated successfully",
      });
      fetchFiles();
      fetchFileStats();
    } catch (error) {
      console.error('Error updating file status:', error);
      toast({
        title: "Error",
        description: "Failed to update file status",
        variant: "destructive",
      });
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

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => {
    const name = (file.original_name || '').toLowerCase();
    const src = (file.source_language || '').toLowerCase();
    const tgt = (file.target_language || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
                         src.includes(searchTerm.toLowerCase()) ||
                         tgt.includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || file.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">File Management</h1>
            <p className="text-muted-foreground">
              Monitor uploaded documents and translation progress
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading files...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File Management</h1>
          <p className="text-muted-foreground">
            Monitor uploaded documents and translation progress
          </p>
        </div>
      </div>

      {/* File Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fileStats?.total_files || 0}</div>
            <p className="text-xs text-muted-foreground">Uploaded documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fileStats?.processing_files || 0}</div>
            <p className="text-xs text-muted-foreground">Currently translating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Translation Accuracy</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fileStats?.average_accuracy ? `${fileStats.average_accuracy.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">Average accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fileStats?.total_storage_used || '0 B'}</div>
            <p className="text-xs text-muted-foreground">Total storage</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search and filter uploaded files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by filename, language..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Status</option>
              <option value="uploaded">Uploaded</option>
              <option value="processing">Processing</option>
              <option value="translated">Translated</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>
            List of all uploaded documents and their translation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Languages</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Translations</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(file.status)}
                      <div>
                        <p className="font-medium">{file.original_name}</p>
                        <p className="text-xs text-muted-foreground">{file.file_type}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{file.source_language}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{file.target_language}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(file.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{(file as any).translations?.length || 0}</span>
                      <span className="text-muted-foreground text-sm">translations</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {file.translation_accuracy ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${file.translation_accuracy}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{file.translation_accuracy}%</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{formatFileSize(file.file_size)}</TableCell>
                  <TableCell>
                    {file.created_at ? new Date(file.created_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(file.id, "processing")}
                          disabled={file.status === "processing"}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Mark Processing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(file.id, "translated")}
                          disabled={file.status === "translated"}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Translated
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(file.id, "failed")}
                          disabled={file.status === "failed"}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Mark Failed
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete File
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 