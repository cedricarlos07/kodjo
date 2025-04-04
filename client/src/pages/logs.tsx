import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle,
  Info,
  AlertCircle,
  RefreshCw,
  Loader2,
  ClipboardList
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface Log {
  id: number;
  level: string;
  message: string;
  timestamp: string;
  userId: number | null;
  scenarioId: number | null;
}

export default function Logs() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logLevel, setLogLevel] = useState<string>("all");
  const { isAuthenticated, isAdmin } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Redirect non-admin users
  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access logs.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAuthenticated, isAdmin, navigate, toast]);

  const { data: logs, isLoading, refetch } = useQuery<Log[]>({
    queryKey: ["/api/logs", { count: 100 }],
    enabled: isAuthenticated && isAdmin,
  });

  const getLogIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case "ERROR":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "WARNING":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "INFO":
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getLogBackgroundColor = (level: string) => {
    switch (level.toUpperCase()) {
      case "ERROR":
        return "bg-red-50";
      case "WARNING":
        return "bg-yellow-50";
      case "INFO":
      default:
        return "bg-blue-50";
    }
  };

  const filteredLogs = logs?.filter((log) => 
    logLevel === "all" || log.level.toUpperCase() === logLevel.toUpperCase()
  );

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:w-64`}>
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <Header 
          title="System Logs" 
          onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <CardTitle>System Logs</CardTitle>
                <div className="flex gap-2">
                  <Select 
                    value={logLevel} 
                    onValueChange={setLogLevel}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="INFO">Info</SelectItem>
                      <SelectItem value="WARNING">Warning</SelectItem>
                      <SelectItem value="ERROR">Error</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => refetch()}
                    title="Refresh logs"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : filteredLogs && filteredLogs.length > 0 ? (
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-lg border ${getLogBackgroundColor(log.level)}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            {getLogIcon(log.level)}
                          </div>
                          <div className="ml-3">
                            <div className="font-medium">{log.message}</div>
                            {(log.userId || log.scenarioId) && (
                              <div className="text-sm text-gray-600 mt-1">
                                {log.userId && <span>User ID: {log.userId}</span>}
                                {log.userId && log.scenarioId && <span> | </span>}
                                {log.scenarioId && <span>Scenario ID: {log.scenarioId}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <ClipboardList className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No logs found</h3>
                  <p className="text-gray-500 mb-4">
                    {logLevel !== "all" 
                      ? `No ${logLevel.toLowerCase()} logs are available. Try selecting a different level.`
                      : "No system logs are available yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
