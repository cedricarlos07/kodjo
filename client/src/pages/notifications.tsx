import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/context/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Send, Calendar, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationForm } from "@/components/notifications/notification-form";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TelegramMessage {
  id: number;
  userId: number;
  courseId: number;
  content: string;
  sentAt: string;
  pointsAwarded: number;
  courseName: string;
  courseGroup: string;
  userName: string;
}

interface ScheduledMessage {
  id: number;
  title: string;
  content: string;
  courseId: number;
  scheduledFor: string;
  sentAt: string | null;
  active: boolean;
}

export default function Notifications() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState<number | null>(null);
  const { isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();

  const { data: recentMessages, isLoading: isLoadingMessages } = useQuery<TelegramMessage[]>({
    queryKey: ["/api/notifications/recent", { count: 10 }],
    enabled: isAuthenticated,
  });

  const { data: scheduledMessages, isLoading: isLoadingScheduled } = useQuery<ScheduledMessage[]>({
    queryKey: ["/api/scheduled-messages"],
    enabled: isAuthenticated,
  });

  interface Course {
    id: number;
    name: string;
    instructor: string;
    dayOfWeek: string;
    time: string;
    zoomLink: string;
    telegramGroup: string | null;
  }

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    enabled: isAuthenticated,
  });

  const deleteScheduledMessageMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/scheduled-messages/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scheduled message has been deleted successfully.",
      });
      setDeleteMessageId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-messages"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete scheduled message",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: { id: number }) => {
      return await apiRequest("POST", `/api/scheduled-messages/${message.id}/send`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Message has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/recent"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/scheduled-messages"] });
    toast({
      title: "Success",
      description: "Notification has been scheduled successfully.",
    });
  };

  const getCourseNameById = (courseId: number) => {
    const courseList = courses as any[] || [];
    const course = courseList.find(c => c.id === courseId);
    return course?.name || "Unknown Course";
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:w-64`}>
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <Header 
          title="Notifications" 
          onMobileMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Telegram Notifications</h2>
            {isAdmin && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule New
              </Button>
            )}
          </div>

          <Tabs defaultValue="sent">
            <TabsList className="mb-4">
              <TabsTrigger value="sent">Sent Messages</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled Messages</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sent">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sent Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingMessages ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                    </div>
                  ) : recentMessages && recentMessages.length > 0 ? (
                    <div className="space-y-4">
                      {recentMessages.map((message) => (
                        <div key={message.id} className="bg-white border rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between">
                            <h3 className="font-medium text-gray-900">{message.courseGroup || message.courseName}</h3>
                            <span className="text-sm text-gray-500">
                              {format(new Date(message.sentAt), "MMM d, yyyy h:mm a")}
                            </span>
                          </div>
                          <p className="mt-2 text-gray-700">{message.content}</p>
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <svg className="mr-1 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
                              <path fill="currentColor" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z" />
                            </svg>
                            <span>Sent by: {message.userName}</span>
                            <span className="mx-2">•</span>
                            <span>+{message.pointsAwarded} point</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <Send className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No messages sent yet</h3>
                      <p className="text-gray-500 mb-4">
                        Schedule your first notification to get started.
                      </p>
                      {isAdmin && (
                        <Button onClick={() => setCreateDialogOpen(true)}>
                          Schedule Notification
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="scheduled">
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingScheduled ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                    </div>
                  ) : scheduledMessages && scheduledMessages.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Scheduled For</TableHead>
                          <TableHead>Status</TableHead>
                          {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scheduledMessages.map((message) => (
                          <TableRow key={message.id}>
                            <TableCell className="font-medium">
                              {message.title}
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {message.content.length > 50 
                                  ? `${message.content.substring(0, 50)}...` 
                                  : message.content}
                              </div>
                            </TableCell>
                            <TableCell>{getCourseNameById(message.courseId)}</TableCell>
                            <TableCell>
                              {format(new Date(message.scheduledFor), "MMM d, yyyy h:mm a")}
                            </TableCell>
                            <TableCell>
                              {message.sentAt ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Sent
                                </span>
                              ) : message.active ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Scheduled
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="text-right space-x-2">
                                {!message.sentAt && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => sendMessageMutation.mutate({ id: message.id })}
                                    >
                                      <Send className="h-3 w-3 mr-1" /> 
                                      Send Now
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-red-500 hover:text-red-700"
                                      onClick={() => setDeleteMessageId(message.id)}
                                    >
                                      Delete
                                    </Button>
                                  </>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-10 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <Calendar className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No scheduled messages</h3>
                      <p className="text-gray-500 mb-4">
                        Schedule your first notification to get started.
                      </p>
                      {isAdmin && (
                        <Button onClick={() => setCreateDialogOpen(true)}>
                          Schedule Notification
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Create Notification Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule New Notification</DialogTitle>
          </DialogHeader>
          <NotificationForm onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteMessageId !== null} onOpenChange={(open) => !open && setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this scheduled message. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMessageId && deleteScheduledMessageMutation.mutate(deleteMessageId)}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteScheduledMessageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
