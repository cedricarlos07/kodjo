import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, addHours, addMinutes } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const notificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Message content is required"),
  courseId: z.string().min(1, "Course is required"),
  scheduledFor: z.date({
    required_error: "Please select a date and time",
  }),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

interface NotificationFormProps {
  onSuccess: () => void;
}

interface Course {
  id: number;
  name: string;
  telegramGroup: string | null;
}

export function NotificationForm({ onSuccess }: NotificationFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("12:00");

  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: "",
      content: "",
      courseId: "",
      scheduledFor: new Date(),
    },
  });

  // Update the scheduledFor date when date or time changes
  const updateScheduledDate = (newDate?: Date, newTime?: string) => {
    const updatedDate = newDate || date;
    const updatedTime = newTime || time;

    if (updatedDate) {
      const [hours, minutes] = updatedTime.split(":").map(Number);
      const scheduledDate = new Date(updatedDate);
      scheduledDate.setHours(hours, minutes, 0, 0);

      form.setValue("scheduledFor", scheduledDate);
    }
  };

  // Handle date change
  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    updateScheduledDate(newDate);
  };

  // Handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    updateScheduledDate(undefined, e.target.value);
  };

  const createNotificationMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      const payload = {
        ...data,
        courseId: parseInt(data.courseId),
      };
      await apiRequest("POST", "/api/scheduled-messages", payload);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = (data: NotificationFormValues) => {
    createNotificationMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notification Title</FormLabel>
              <FormControl>
                <Input placeholder="Class Reminder" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Don't forget to join our class tomorrow!"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This message will be sent to the Telegram group associated with the selected course.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="courseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoadingCourses}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      <div className="flex flex-col">
                        <span>{course.name}</span>
                        {course.telegramGroup && (
                          <span className="text-xs text-gray-500">Groupe: {course.telegramGroup}</span>
                        )}
                        {!course.telegramGroup && (
                          <span className="text-xs text-red-500">Aucun groupe Telegram</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="scheduledFor"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Time</FormLabel>
            <Input
              type="time"
              value={time}
              onChange={handleTimeChange}
            />
          </FormItem>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={createNotificationMutation.isPending}>
            {createNotificationMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              "Schedule Notification"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
