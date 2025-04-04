import React, { useState } from 'react';
import { useZoomMeeting } from '../../hooks/useZoomMeeting';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table';
import { Badge } from '../ui/badge';

interface ZoomMeetingProps {
  courseId: number;
}

export function ZoomMeeting({ courseId }: ZoomMeetingProps) {
  const {
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
  } = useZoomMeeting(courseId);

  const [isCreating, setIsCreating] = useState(false);
  const [topic, setTopic] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: ''
  });

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMeeting.mutateAsync({
        topic,
        startTime: new Date(startTime),
        duration
      });
      setIsCreating(false);
      setTopic('');
      setStartTime('');
      setDuration(60);
    } catch (error) {
      console.error('Failed to create meeting:', error);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addParticipant.mutateAsync({
        userId: Date.now(),
        ...newParticipant
      });
      setNewParticipant({ name: '', email: '' });
    } catch (error) {
      console.error('Failed to add participant:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'invited':
        return <Badge variant="secondary">Invité</Badge>;
      case 'joined':
        return <Badge variant="success">Rejoint</Badge>;
      case 'left':
        return <Badge variant="outline">Quitté</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div>Erreur: {error.message}</div>;
  }

  if (!meeting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Réunion Zoom</CardTitle>
          <CardDescription>
            Créez une nouvelle réunion Zoom pour ce cours
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isCreating ? (
            <Button onClick={() => setIsCreating(true)}>
              Créer une réunion
            </Button>
          ) : (
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <Label htmlFor="topic">Sujet</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startTime">Date et heure</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Durée (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMeeting.isPending}>
                  {createMeeting.isPending ? 'Création...' : 'Créer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réunion Zoom</CardTitle>
        <CardDescription>
          {formattedStartTime} - {meeting.duration} minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Détails de la réunion</h3>
            <p className="text-sm text-muted-foreground">
              Sujet: {meeting.topic}
            </p>
            <p className="text-sm text-muted-foreground">
              Lien: <a href={meeting.joinUrl}>{meeting.joinUrl}</a>
            </p>
            {meeting.password && (
              <p className="text-sm text-muted-foreground">
                Mot de passe: {meeting.password}
              </p>
            )}
          </div>

          {stats && (
            <div>
              <h3 className="text-lg font-medium mb-2">Statistiques</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total: {stats.total}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Rejoints: {stats.joined}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Quittés: {stats.left}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Absents: {stats.absent}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">
                    Durée moyenne: {stats.averageDuration.toFixed(1)} minutes
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium mb-2">Participants</h3>
            <form onSubmit={handleAddParticipant} className="mb-4 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Nom"
                  value={newParticipant.name}
                  onChange={(e) =>
                    setNewParticipant({ ...newParticipant, name: e.target.value })
                  }
                  required
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newParticipant.email}
                  onChange={(e) =>
                    setNewParticipant({ ...newParticipant, email: e.target.value })
                  }
                  required
                />
                <Button type="submit" disabled={addParticipant.isPending}>
                  {addParticipant.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </form>

            {meeting.participants && meeting.participants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Heure de connexion</TableHead>
                    <TableHead>Heure de déconnexion</TableHead>
                    <TableHead>Durée</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meeting.participants.map((participant) => (
                    <TableRow key={participant.userId}>
                      <TableCell>{participant.name}</TableCell>
                      <TableCell>{participant.email}</TableCell>
                      <TableCell>{getStatusBadge(participant.status)}</TableCell>
                      <TableCell>
                        {participant.joinTime
                          ? format(new Date(participant.joinTime), 'HH:mm', {
                              locale: fr
                            })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {participant.leaveTime
                          ? format(new Date(participant.leaveTime), 'HH:mm', {
                              locale: fr
                            })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {participant.duration
                          ? `${participant.duration.toFixed(1)} min`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun participant pour le moment
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => deleteMeeting.mutate()}
              disabled={deleteMeeting.isPending}
            >
              {deleteMeeting.isPending ? 'Suppression...' : 'Supprimer la réunion'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 