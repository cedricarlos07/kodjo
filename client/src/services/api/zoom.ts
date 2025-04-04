import { AxiosInstance } from 'axios';
import { z } from 'zod';

// Schémas de validation
const MeetingSchema = z.object({
  id: z.string(),
  topic: z.string(),
  start_time: z.string(),
  duration: z.number(),
  join_url: z.string(),
  password: z.string().optional(),
});

const CreateMeetingSchema = z.object({
  topic: z.string(),
  start_time: z.string(),
  duration: z.number(),
  timezone: z.string().default('UTC'),
});

export type Meeting = z.infer<typeof MeetingSchema>;
export type CreateMeeting = z.infer<typeof CreateMeetingSchema>;

export const zoomApi = (api: AxiosInstance) => ({
  // Créer une réunion Zoom
  createMeeting: async (data: CreateMeeting) => {
    const response = await api.post('/api/zoom/meetings', data);
    return MeetingSchema.parse(response.data);
  },

  // Obtenir les réunions à venir
  getUpcomingMeetings: async () => {
    const response = await api.get('/api/zoom/meetings/upcoming');
    return z.array(MeetingSchema).parse(response.data);
  },

  // Obtenir une réunion spécifique
  getMeeting: async (meetingId: string) => {
    const response = await api.get(`/api/zoom/meetings/${meetingId}`);
    return MeetingSchema.parse(response.data);
  },

  // Supprimer une réunion
  deleteMeeting: async (meetingId: string) => {
    await api.delete(`/api/zoom/meetings/${meetingId}`);
  },
}); 