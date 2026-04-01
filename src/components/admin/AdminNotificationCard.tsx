import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import { Send } from "lucide-react";

export const AdminNotificationCard = () => {
  const { toast } = useToast();
  const [notification, setNotification] = useState({ title: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSendNotification = async () => {
    if (!notification.title || !notification.message) {
      toast({
        title: "Preencha todos os campos",
        description: "Título e mensagem são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: notificationData, error } = await supabase
        .from("notifications")
        .insert({
          title: notification.title,
          message: notification.message,
          created_by: user.id,
          is_global: true,
        })
        .select()
        .single();

      if (error) throw error;

      const { data: allUsers, error: usersError } = await supabase
        .from("profiles")
        .select("id")
        .neq("id", user.id);

      if (usersError) throw usersError;

      if (allUsers && allUsers.length > 0) {
        const userNotifications = allUsers.map((u) => ({
          user_id: u.id,
          notification_id: notificationData.id,
        }));

        const { error: insertError } = await supabase
          .from("user_notifications")
          .insert(userNotifications);

        if (insertError) throw insertError;
      }

      toast({
        title: "Notificação enviada!",
        description: `${allUsers?.length || 0} usuários foram notificados.`,
      });
      setNotification({ title: "", message: "" });
    } catch (error) {
      logger.error("Error sending notification", error, { context: "AdminDashboard" });
      toast({
        title: "Erro ao enviar notificação",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar Notificação</CardTitle>
        <CardDescription>Envie uma mensagem para todos os usuários do sistema</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notif-title">Título</Label>
          <Input
            id="notif-title"
            value={notification.title}
            onChange={(e) => setNotification({ ...notification, title: e.target.value })}
            placeholder="Título da notificação"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notif-message">Mensagem</Label>
          <Textarea
            id="notif-message"
            value={notification.message}
            onChange={(e) => setNotification({ ...notification, message: e.target.value })}
            placeholder="Conteúdo da mensagem..."
            rows={5}
          />
        </div>
        <Button onClick={handleSendNotification} disabled={sending} className="w-full">
          <Send className="w-4 h-4 mr-2" />
          {sending ? "Enviando..." : "Enviar para Todos"}
        </Button>
      </CardContent>
    </Card>
  );
};
