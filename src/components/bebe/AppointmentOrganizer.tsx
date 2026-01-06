import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, MapPin, User, Clock, CheckCircle2, Trash2 } from "lucide-react";
import { useBabyAppointments, APPOINTMENT_TYPES } from "@/hooks/useBabyAppointments";
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AppointmentOrganizerProps {
  babyProfileId?: string;
}

export const AppointmentOrganizer = ({ babyProfileId }: AppointmentOrganizerProps) => {
  const {
    upcomingAppointments,
    pastAppointments,
    todayAppointments,
    isLoading,
    addAppointment,
    toggleCompleted,
    deleteAppointment,
    isAdding,
  } = useBabyAppointments(babyProfileId);

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    appointment_type: "pediatra",
    doctor_name: "",
    location: "",
    scheduled_date: "",
    scheduled_time: "",
    duration_minutes: 30,
    notes: "",
  });

  const handleSubmit = () => {
    addAppointment({
      baby_profile_id: babyProfileId,
      title: formData.title,
      appointment_type: formData.appointment_type,
      doctor_name: formData.doctor_name || null,
      location: formData.location || null,
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time || null,
      duration_minutes: formData.duration_minutes,
      notes: formData.notes || null,
    });

    setFormData({
      title: "",
      appointment_type: "pediatra",
      doctor_name: "",
      location: "",
      scheduled_date: "",
      scheduled_time: "",
      duration_minutes: 30,
      notes: "",
    });
    setIsOpen(false);
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const getTypeInfo = (type: string) => {
    return APPOINTMENT_TYPES.find(t => t.value === type) || APPOINTMENT_TYPES[6];
  };

  const AppointmentCard = ({ appointment, showCompleteButton = true }: { appointment: typeof upcomingAppointments[0], showCompleteButton?: boolean }) => {
    const typeInfo = getTypeInfo(appointment.appointment_type);
    const dateLabel = getDateLabel(appointment.scheduled_date);

    return (
      <div
        className={`p-4 rounded-lg border transition-colors ${
          appointment.completed ? 'bg-muted/50 opacity-70' : 'bg-background hover:bg-muted/30'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
            {typeInfo.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${appointment.completed ? 'line-through' : ''}`}>
                {appointment.title}
              </span>
              <Badge variant="outline" className="text-xs">
                {typeInfo.label}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {dateLabel}
              </span>
              {appointment.scheduled_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {appointment.scheduled_time.slice(0, 5)}
                </span>
              )}
            </div>

            {appointment.doctor_name && (
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                {appointment.doctor_name}
              </div>
            )}

            {appointment.location && (
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {appointment.location}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {showCompleteButton && !appointment.completed && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => toggleCompleted({ id: appointment.id, completed: true })}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => deleteAppointment(appointment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <Card className="animate-pulse h-64" />;
  }

  return (
    <div className="space-y-4">
      {/* Today's Alert */}
      {todayAppointments.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium">Consultas Hoje</span>
              <Badge>{todayAppointments.length}</Badge>
            </div>
            <div className="space-y-2">
              {todayAppointments.map(apt => (
                <div key={apt.id} className="flex items-center justify-between bg-background rounded p-2">
                  <div className="flex items-center gap-2">
                    <span>{getTypeInfo(apt.appointment_type).icon}</span>
                    <span className="font-medium">{apt.title}</span>
                    {apt.scheduled_time && (
                      <Badge variant="secondary">{apt.scheduled_time.slice(0, 5)}</Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleCompleted({ id: apt.id, completed: true })}
                  >
                    Concluir
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Organizador de Consultas
            </CardTitle>
            <CardDescription>
              Gerencie as consultas e exames do bebê
            </CardDescription>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Agendar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Consulta</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Consulta de rotina 6 meses"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.appointment_type}
                    onValueChange={v => setFormData(prev => ({ ...prev, appointment_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPOINTMENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            {type.icon} {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Input
                      type="date"
                      value={formData.scheduled_date}
                      onChange={e => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={formData.scheduled_time}
                      onChange={e => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Médico/Profissional</Label>
                  <Input
                    value={formData.doctor_name}
                    onChange={e => setFormData(prev => ({ ...prev, doctor_name: e.target.value }))}
                    placeholder="Dr(a). Nome"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Local</Label>
                  <Input
                    value={formData.location}
                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Clínica, hospital, endereço..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Levar exames, perguntar sobre..."
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={!formData.title || !formData.scheduled_date || isAdding}
                >
                  Agendar Consulta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="upcoming">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="upcoming" className="flex-1">
                Próximas ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1">
                Histórico ({pastAppointments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <ScrollArea className="h-[300px]">
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingAppointments.map(apt => (
                      <AppointmentCard key={apt.id} appointment={apt} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma consulta agendada</p>
                    <p className="text-sm">Agende as consultas do bebê</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="past">
              <ScrollArea className="h-[300px]">
                {pastAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {pastAppointments.map(apt => (
                      <AppointmentCard key={apt.id} appointment={apt} showCompleteButton={false} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum histórico ainda</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
