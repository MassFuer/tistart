import { useState, useEffect } from "react";
import { usersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Loading from "../common/Loading";
import { HardDrive, File, Film, Copy, Image as ImageIcon, ExternalLink, Search, Filter, RefreshCw } from "lucide-react";

// Helper to format bytes
const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "-";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const StorageManager = () => {
    const { user, refreshUser } = useAuth();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recalculating, setRecalculating] = useState(false);
    const [sortBy, setSortBy] = useState("date-desc");
    const [filterType, setFilterType] = useState("all");
    const [search, setSearch] = useState("");

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await usersAPI.getMyFiles();
            setFiles(res.data.data);
        } catch (error) {
            console.error("Failed to fetch files:", error);
            toast.error("Failed to load your files");
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculate = async () => {
        try {
            setRecalculating(true);
            toast.info("Recalculating storage usage...");
            const res = await usersAPI.syncStorage(); 
            const bytes = res.data.debug?.totalBytesCalculated ?? res.data.data?.storage?.totalBytes ?? 0;
            const newBytesFormatted = formatBytes(bytes);
            toast.success(`Storage updated: ${newBytesFormatted} found.`);
            // Refresh global user context to update UI without reload
            await refreshUser();
        } catch (error) {
            console.error("Sync error:", error);
            toast.error("Failed to recalculate storage");
        } finally {
            setRecalculating(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    // Filter and Sort
    const filteredFiles = files
        .filter((file) => {
            const matchesType = filterType === "all" || file.type === filterType;
            const matchesSearch = file.key.toLowerCase().includes(search.toLowerCase());
            return matchesType && matchesSearch;
        })
        .sort((a, b) => {
            if (sortBy === "date-desc") return new Date(b.lastModified) - new Date(a.lastModified);
            if (sortBy === "date-asc") return new Date(a.lastModified) - new Date(b.lastModified);
            if (sortBy === "size-desc") return b.size - a.size;
            if (sortBy === "size-asc") return a.size - b.size;
            if (sortBy === "name-asc") return a.key.localeCompare(b.key);
            return 0;
        });

    // Stats
    const totalUsage = user?.storage?.totalBytes || 0;
    const quota = user?.storage?.quotaBytes || 5 * 1024 * 1024 * 1024; // 5GB default
    const usagePercent = Math.min((totalUsage / quota) * 100, 100);

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
                {/* Usage Card */}
                <Card className="md:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex flex-col space-y-1.5">
                            <CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5" /> Storage Usage</CardTitle>
                            <CardDescription>Your current plan usage</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleRecalculate} disabled={recalculating} title="Recalculate Usage">
                            <RefreshCw className={`h-4 w-4 ${recalculating ? "animate-spin" : ""}`} />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                             <div className="flex justify-between text-sm font-medium">
                                 <span>Used</span>
                                 <span>{formatBytes(totalUsage)} / {formatBytes(quota)}</span>
                             </div>
                             <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full ${usagePercent > 90 ? "bg-destructive" : usagePercent > 75 ? "bg-yellow-500" : "bg-primary"}`} 
                                    style={{ width: `${usagePercent}%` }}
                                 />
                             </div>
                        </div>

                        <div className="pt-4 border-t space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Film className="h-4 w-4" /> Videos
                                </span>
                                <span>{formatBytes(user?.storage?.videoBytes || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" /> Images
                                </span>
                                <span>{formatBytes(user?.storage?.imageBytes || 0)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* File Browser Info */}
                <Card className="md:col-span-2">
                     <CardHeader>
                         <CardTitle>File Manager</CardTitle>
                         <CardDescription>
                             Manage your uploaded assets. You have {files.length} total files.
                         </CardDescription>
                     </CardHeader>
                     <CardContent className="flex flex-col gap-4">
                         <div className="flex flex-col md:flex-row gap-4">
                             <div className="relative flex-1">
                                 <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                 <Input 
                                     placeholder="Search files..." 
                                     value={search}
                                     onChange={(e) => setSearch(e.target.value)}
                                     className="pl-8"
                                 />
                             </div>
                             <Select value={filterType} onValueChange={setFilterType}>
                                 <SelectTrigger className="w-[150px]">
                                     <SelectValue placeholder="All Types" />
                                 </SelectTrigger>
                                 <SelectContent>
                                     <SelectItem value="all">All Types</SelectItem>
                                     <SelectItem value="artwork">Artworks</SelectItem>
                                     <SelectItem value="video">Videos</SelectItem>
                                     <SelectItem value="event">Events</SelectItem>
                                     <SelectItem value="profile">Profile</SelectItem>
                                 </SelectContent>
                             </Select>
                             <Select value={sortBy} onValueChange={setSortBy}>
                                 <SelectTrigger className="w-[150px]">
                                     <SelectValue placeholder="Sort by" />
                                 </SelectTrigger>
                                 <SelectContent>
                                     <SelectItem value="date-desc">Newest First</SelectItem>
                                     <SelectItem value="date-asc">Oldest First</SelectItem>
                                     <SelectItem value="size-desc">Largest First</SelectItem>
                                     <SelectItem value="size-asc">Smallest First</SelectItem>
                                     <SelectItem value="name-asc">Name A-Z</SelectItem>
                                 </SelectContent>
                             </Select>
                         </div>
                     </CardContent>
                </Card>
            </div>

            {/* File List */}
            <Card>
                {loading ? (
                    <div className="py-20 flex justify-center"><Loading message="Loading files..." /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>File Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Last Modified</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredFiles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        No files found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredFiles.map((file, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            {file.type === "video" ? <Film className="h-4 w-4 text-blue-500" /> : <ImageIcon className="h-4 w-4 text-orange-500" />}
                                        </TableCell>
                                        <TableCell className="font-medium max-w-[300px] truncate" title={file.key}>
                                            {file.key.split('/').pop()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">{file.type}</Badge>
                                        </TableCell>
                                        <TableCell>{formatBytes(file.size)}</TableCell>
                                        <TableCell>{new Date(file.lastModified).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                    navigator.clipboard.writeText(file.url);
                                                    toast.success("URL copied to clipboard");
                                                }}>
                                                    <Copy className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </a>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
};

export default StorageManager;
