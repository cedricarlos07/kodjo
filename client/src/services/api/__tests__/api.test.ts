import { describe, it, expect, vi } from 'vitest';
import { apiService } from '../index';
import axios from 'axios';

vi.mock('axios');

describe('API Service', () => {
  describe('Zoom API', () => {
    it('should create a meeting', async () => {
      const mockMeeting = {
        id: '123',
        topic: 'Test Meeting',
        start_time: '2024-01-01T10:00:00Z',
        duration: 60,
        join_url: 'https://zoom.us/j/123',
      };

      vi.mocked(axios).post.mockResolvedValueOnce({ data: mockMeeting });

      const result = await apiService.createMeeting({
        topic: 'Test Meeting',
        start_time: '2024-01-01T10:00:00Z',
        duration: 60,
      });

      expect(result).toEqual(mockMeeting);
      expect(axios.post).toHaveBeenCalledWith(
        '/api/zoom/meetings',
        expect.any(Object)
      );
    });

    it('should get upcoming meetings', async () => {
      const mockMeetings = [
        {
          id: '123',
          topic: 'Test Meeting 1',
          start_time: '2024-01-01T10:00:00Z',
          duration: 60,
          join_url: 'https://zoom.us/j/123',
        },
      ];

      vi.mocked(axios).get.mockResolvedValueOnce({ data: mockMeetings });

      const result = await apiService.getUpcomingMeetings();

      expect(result).toEqual(mockMeetings);
      expect(axios.get).toHaveBeenCalledWith('/api/zoom/meetings/upcoming');
    });
  });

  describe('Telegram API', () => {
    it('should send a message', async () => {
      const mockMessage = {
        id: '123',
        chat_id: '456',
        text: 'Hello World',
        sent_at: '2024-01-01T10:00:00Z',
        status: 'sent',
      };

      vi.mocked(axios).post.mockResolvedValueOnce({ data: mockMessage });

      const result = await apiService.sendMessage({
        chat_id: '456',
        text: 'Hello World',
      });

      expect(result).toEqual(mockMessage);
      expect(axios.post).toHaveBeenCalledWith(
        '/api/telegram/messages',
        expect.any(Object)
      );
    });

    it('should get message history', async () => {
      const mockMessages = [
        {
          id: '123',
          chat_id: '456',
          text: 'Hello World',
          sent_at: '2024-01-01T10:00:00Z',
          status: 'sent',
        },
      ];

      vi.mocked(axios).get.mockResolvedValueOnce({ data: mockMessages });

      const result = await apiService.getMessageHistory('456');

      expect(result).toEqual(mockMessages);
      expect(axios.get).toHaveBeenCalledWith('/api/telegram/messages/456');
    });
  });
}); 