import { AxiosInstance } from 'axios';
import { z } from 'zod';

// Schémas de validation
const MessageSchema = z.object({
  id: z.string(),
  chat_id: z.string(),
  text: z.string(),
  sent_at: z.string(),
  status: z.enum(['pending', 'sent', 'failed']),
});

const SendMessageSchema = z.object({
  chat_id: z.string(),
  text: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;
export type SendMessage = z.infer<typeof SendMessageSchema>;

export const telegramApi = (api: AxiosInstance) => ({
  // Envoyer un message
  sendMessage: async (data: SendMessage) => {
    const response = await api.post('/api/telegram/messages', data);
    return MessageSchema.parse(response.data);
  },

  // Obtenir l'historique des messages
  getMessageHistory: async (chatId: string) => {
    const response = await api.get(`/api/telegram/messages/${chatId}`);
    return z.array(MessageSchema).parse(response.data);
  },

  // Obtenir le statut d'un message
  getMessageStatus: async (messageId: string) => {
    const response = await api.get(`/api/telegram/messages/${messageId}/status`);
    return MessageSchema.parse(response.data);
  },

  // Programmer un message
  scheduleMessage: async (data: SendMessage & { scheduled_at: string }) => {
    const response = await api.post('/api/telegram/messages/schedule', data);
    return MessageSchema.parse(response.data);
  },
}); 