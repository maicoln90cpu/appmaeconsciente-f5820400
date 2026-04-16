import { useState } from 'react';

import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { useProfile } from '@/hooks/useProfile';
import { useTickets, TicketFormData } from '@/hooks/useTickets';

import { backgroundSync } from '@/lib/background-sync';


export const TicketForm = () => {
  const { createTicket } = useTickets();
  const { profile } = useProfile();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<TicketFormData>({
    name: '',
    email: profile?.email || '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!navigator.onLine) {
        // Queue for background sync when offline
        await backgroundSync.addTask('ticket', formData);
        toast('Ticket salvo', {
          description: 'Seu ticket será enviado quando a conexão retornar.',
        });
        setFormData({
          name: '',
          email: profile?.email || '',
          subject: '',
          message: '',
        });
      } else {
        const result = await createTicket(formData);

        if (result.success) {
          setFormData({
            name: '',
            email: profile?.email || '',
            subject: '',
            message: '',
          });
        }
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('Erro', { description: 'Não foi possível enviar o ticket. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abrir Ticket de Suporte</CardTitle>
        <CardDescription>
          Preencha o formulário abaixo e nossa equipe entrará em contato em breve
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                maxLength={255}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              required
              rows={6}
              maxLength={2000}
              className="resize-none"
            />
            <div className="text-sm text-muted-foreground text-right">
              {formData.message.length}/2000
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Ticket
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
