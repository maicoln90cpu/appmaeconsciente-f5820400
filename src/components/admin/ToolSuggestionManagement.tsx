import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import { Loader2, CheckCircle, XCircle, Code, Rocket, Gift, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getSuggestionStatusBadgeVariant, getSuggestionStatusLabel, type SuggestionStatus } from "@/lib/ticket-utils";

export const ToolSuggestionManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["admin-tool-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_suggestions")
        .select(`
          *,
          profiles:user_id (email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, feedback }: { id: string; status: SuggestionStatus; feedback?: string }) => {
      const updateData: any = { status };
      if (feedback) {
        updateData.admin_feedback = feedback;
      }

      const { error } = await supabase
        .from("tool_suggestions")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Update related ticket status
      await supabase
        .from("support_tickets")
        .update({ 
          status: status === "rejected" ? "closed" : status === "implemented" ? "resolved" : "in_progress" 
        })
        .eq("related_suggestion_id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tool-suggestions"] });
      toast({ title: "Status atualizado com sucesso!" });
      setFeedbackMap({});
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar status",
        variant: "destructive",
      });
    },
  });

  const grantRewardMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tool_suggestions")
        .update({ reward_granted: true })
        .eq("id", id);

      if (error) throw error;

      // TODO: Implementar lógica de concessão de acesso premium
      // Isso será feito via Edge Function quando o sistema de referral estiver pronto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tool-suggestions"] });
      toast({ title: "Recompensa concedida com sucesso!" });
    },
    onError: () => {
      toast({
        title: "Erro ao conceder recompensa",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: SuggestionStatus) => {
    switch (status) {
      case "pending": return "secondary";
      case "approved": return "default";
      case "in_development": return "outline";
      case "implemented": return "default";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: SuggestionStatus) => {
    switch (status) {
      case "pending": return "Pendente";
      case "approved": return "Aprovada";
      case "in_development": return "Em Desenvolvimento";
      case "implemented": return "Implementada";
      case "rejected": return "Rejeitada";
      default: return status;
    }
  };

  const filteredSuggestions = suggestions?.filter(s => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesSearch = !searchTerm || 
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.main_idea.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: suggestions?.length || 0,
    pending: suggestions?.filter(s => s.status === "pending").length || 0,
    approved: suggestions?.filter(s => s.status === "approved").length || 0,
    implemented: suggestions?.filter(s => s.status === "implemented").length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Sugestões</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendentes</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aprovadas</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Implementadas</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{stats.implemented}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovadas</SelectItem>
            <SelectItem value="in_development">Em Desenvolvimento</SelectItem>
            <SelectItem value="implemented">Implementadas</SelectItem>
            <SelectItem value="rejected">Rejeitadas</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Buscar por título ou ideia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {filteredSuggestions?.map((suggestion) => (
          <Card key={suggestion.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>{suggestion.title}</CardTitle>
                    <Badge variant={getStatusColor(suggestion.status as SuggestionStatus)}>
                      {getStatusLabel(suggestion.status as SuggestionStatus)}
                    </Badge>
                    {suggestion.reward_granted && (
                      <Badge variant="outline" className="bg-yellow-500/10">
                        <Gift className="h-3 w-3 mr-1" />
                        Recompensa Concedida
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Por: {(suggestion.profiles as any)?.email} • 
                    {new Date(suggestion.created_at).toLocaleDateString('pt-BR')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(suggestion.priority_rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-1">Ideia Principal:</p>
                <p className="text-sm text-muted-foreground">{suggestion.main_idea}</p>
              </div>

              {suggestion.problem_solved && (
                <div>
                  <p className="text-sm font-semibold mb-1">Problema que Resolve:</p>
                  <p className="text-sm text-muted-foreground">{suggestion.problem_solved}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold mb-1">Funcionalidades:</p>
                <p className="text-sm text-muted-foreground">{suggestion.main_functions}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div>
                  <p className="text-xs font-semibold mb-1">Integrações:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.integrations?.map((int: string) => (
                      <Badge key={int} variant="outline" className="text-xs">{int}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Fases:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.phases?.map((phase: string) => (
                      <Badge key={phase} variant="secondary" className="text-xs">{phase}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {suggestion.admin_feedback && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-semibold mb-1">Feedback Admin:</p>
                  <p className="text-sm">{suggestion.admin_feedback}</p>
                </div>
              )}

              {/* Admin Actions */}
              <div className="border-t pt-4 space-y-3">
                <Textarea
                  placeholder="Feedback para o usuário (opcional)..."
                  value={feedbackMap[suggestion.id] || ""}
                  onChange={(e) => setFeedbackMap(prev => ({ ...prev, [suggestion.id]: e.target.value }))}
                  rows={2}
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({
                      id: suggestion.id,
                      status: "approved",
                      feedback: feedbackMap[suggestion.id]
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprovar
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({
                      id: suggestion.id,
                      status: "in_development",
                      feedback: feedbackMap[suggestion.id]
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Code className="mr-2 h-4 w-4" />
                    Em Desenvolvimento
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({
                      id: suggestion.id,
                      status: "implemented",
                      feedback: feedbackMap[suggestion.id]
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    Implementada
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatusMutation.mutate({
                      id: suggestion.id,
                      status: "rejected",
                      feedback: feedbackMap[suggestion.id] || "Sugestão rejeitada"
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeitar
                  </Button>

                  {suggestion.status === "approved" && !suggestion.reward_granted && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => grantRewardMutation.mutate(suggestion.id)}
                      disabled={grantRewardMutation.isPending}
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      Conceder Recompensa
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredSuggestions?.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              Nenhuma sugestão encontrada
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
