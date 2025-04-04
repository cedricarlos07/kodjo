import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
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
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

const courseSchema = z.object({
  name: z.string().min(1, "Le nom du cours est requis"),
  instructor: z.string().min(1, "Le nom de l'instructeur est requis"),
  courseNumber: z.number().int().positive().optional().nullable(),
  professorName: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
  dayOfWeek: z.string().min(1, "Le jour de la semaine est requis"),
  time: z.string().min(1, "L'heure est requise"),
  zoomLink: z.string().url("Doit être une URL valide"),
  zoomId: z.string().optional().nullable(),
  telegramGroup: z.string().optional().nullable(),
  startDateTime: z.string().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseFormProps {
  course?: {
    id: number;
    courseNumber: number | null;
    name: string;
    instructor: string;
    professorName: string | null;
    level: string | null;
    schedule: string | null;
    dayOfWeek: string;
    time: string;
    zoomLink: string;
    zoomId: string | null;
    telegramGroup: string | null;
    startDateTime: string | null;
    duration: number | null;
  } | null;
  onSuccess: () => void;
}

export function CourseForm({ course, onSuccess }: CourseFormProps) {
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: course?.name || "",
      instructor: course?.instructor || "",
      courseNumber: course?.courseNumber || null,
      professorName: course?.professorName || "",
      level: course?.level || "",
      schedule: course?.schedule || "",
      dayOfWeek: course?.dayOfWeek || "",
      time: course?.time || "",
      zoomLink: course?.zoomLink || "",
      zoomId: course?.zoomId || "",
      telegramGroup: course?.telegramGroup || "",
      startDateTime: course?.startDateTime || "",
      duration: course?.duration || null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      if (course) {
        await apiRequest("PUT", `/api/courses/${course.id}`, data);
      } else {
        await apiRequest("POST", "/api/courses", data);
      }
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = (data: CourseFormValues) => {
    createMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du cours</FormLabel>
              <FormControl>
                <Input placeholder="Web Development" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instructor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructeur</FormLabel>
              <FormControl>
                <Input placeholder="Prof. Johnson" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dayOfWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jour de la semaine</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un jour" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Lundi">Lundi</SelectItem>
                    <SelectItem value="Mardi">Mardi</SelectItem>
                    <SelectItem value="Mercredi">Mercredi</SelectItem>
                    <SelectItem value="Jeudi">Jeudi</SelectItem>
                    <SelectItem value="Vendredi">Vendredi</SelectItem>
                    <SelectItem value="Samedi">Samedi</SelectItem>
                    <SelectItem value="Dimanche">Dimanche</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="zoomLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lien Zoom</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://zoom.us/j/1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="courseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro du cours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1"
                    {...field}
                    value={field.value === null ? '' : field.value}
                    onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="professorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du Professeur</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Niveau</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner niveau" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="BBG">BBG</SelectItem>
                    <SelectItem value="ABG">ABG</SelectItem>
                    <SelectItem value="IG">IG</SelectItem>
                    <SelectItem value="ZBG">ZBG</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="schedule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horaire</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner horaire" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MW">MW (Lundi/Mercredi)</SelectItem>
                    <SelectItem value="TT">TT (Mardi/Jeudi)</SelectItem>
                    <SelectItem value="FS">FS (Vendredi/Samedi)</SelectItem>
                    <SelectItem value="SS">SS (Samedi/Dimanche)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="zoomId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zoom ID</FormLabel>
                <FormControl>
                  <Input placeholder="123 456 7890" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durée (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="60"
                    {...field}
                    value={field.value === null ? '' : field.value}
                    onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="telegramGroup"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Groupe Telegram</FormLabel>
              <FormControl>
                <Input placeholder="@webdev_group" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDateTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date et heure de début</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {course ? "Mise à jour..." : "Création..."}
              </>
            ) : (
              course ? "Mettre à jour le cours" : "Créer le cours"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
