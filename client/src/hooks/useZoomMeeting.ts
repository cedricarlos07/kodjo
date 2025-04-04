import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

interface ZoomParticipant {
  userId: number;
  name: string;
  email: string;
  status: 'invited' | 'joined' | 'left' | 'absent';
  joinTime?: Date;
  leaveTime?: Date;
  duration?: number;
}

interface ZoomMeeting {
  id: string;
  topic: string;
  startTime: Date;
  duration: number;
  joinUrl: string;
  password?: string;
  participants?: ZoomParticipant[];
}

interface CreateMeetingData {
  topic: string;
  startTime: Date;
  duration: number;
  participants?: ZoomParticipant[];
}

interface ParticipantStats {
  total: number;
  joined: number;
  left: number;
  absent: number;
  averageDuration: number;
}

export function useZoomMeeting(courseId: number) {
  const queryClient = useQueryClient();

  const { data: meeting, isLoading, error } = useQuery<ZoomMeeting>({
    queryKey: ['zoomMeeting', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}/zoom`);
      if (!response.ok) {
        throw new Error('Failed to fetch Zoom meeting');
      }
      return response.json();
    }
  });

  const createMeeting = useMutation({
    mutationFn: async (data: CreateMeetingData) => {
      const response = await fetch(`/api/courses/${courseId}/zoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error('Failed to create Zoom meeting');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoomMeeting', courseId] });
    }
  });

  const updateMeeting = useMutation({
    mutationFn: async (data: Partial<ZoomMeeting>) => {
      const response = await fetch(`/api/courses/${courseId}/zoom`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error('Failed to update Zoom meeting');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoomMeeting', courseId] });
    }
  });

  const deleteMeeting = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/courses/${courseId}/zoom`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete Zoom meeting');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoomMeeting', courseId] });
    }
  });

  const addParticipant = useMutation({
    mutationFn: async (participant: Omit<ZoomParticipant, 'status'>) => {
      const response = await fetch(`/api/courses/${courseId}/zoom/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...participant,
          status: 'invited'
        })
      });
      if (!response.ok) {
        throw new Error('Failed to add participant');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoomMeeting', courseId] });
    }
  });

  const updateParticipantStatus = useMutation({
    mutationFn: async ({
      userId,
      status,
      joinTime,
      leaveTime
    }: {
      userId: number;
      status: ZoomParticipant['status'];
      joinTime?: Date;
      leaveTime?: Date;
    }) => {
      const response = await fetch(`/api/courses/${courseId}/zoom/participants/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          joinTime: joinTime?.toISOString(),
          leaveTime: leaveTime?.toISOString()
        })
      });
      if (!response.ok) {
        throw new Error('Failed to update participant status');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoomMeeting', courseId] });
    }
  });

  const { data: stats } = useQuery<ParticipantStats>({
    queryKey: ['zoomStats', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}/zoom/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch participant stats');
      }
      return response.json();
    }
  });

  const formattedStartTime = meeting?.startTime
    ? format(new Date(meeting.startTime), 'PPP p')
    : '';

  return {
    meeting,
    isLoading,
    error,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    addParticipant,
    updateParticipantStatus,
    stats,
    formattedStartTime
  };
} 