import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { useSortableTable } from "@/hooks/useSortableTable";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, Sparkles, Trash2, Eye, EyeOff, ExternalLink, Search, RefreshCw, Pencil
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  categories: string[];
  views_count: number;
  reading_time_min: number;
  is_ai_generated: boolean;
  created_at: string;
  published_at: string | null;
  featured_image_url: string | null;
  excerpt: string | null;
}

export const BlogPostManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [generating, setGenerating] = useState(false);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [showTopicDialog, setShowTopicDialog] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, status, categories, views_count, reading_time_min, is_ai_generated, created_at, published_at, featured_image_url, excerpt")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const { sortedData, sortKey, sortDirection, handleSort } = useSortableTable(
    posts || [],
    { key: "created_at", direction: "desc" }
  );

  const filtered = sortedData.filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const updates: Record<string, unknown> = { status: newStatus };
      if (newStatus === "published") updates.published_at = new Date().toISOString();
      const { error } = await supabase.from("blog_posts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Status atualizado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Post excluído");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, excerpt, status }: { id: string; title: string; excerpt: string; status: string }) => {
      const updates: Record<string, unknown> = { title, excerpt, status };
      if (status === "published") updates.published_at = new Date().toISOString();
      const { error } = await supabase.from("blog_posts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      setEditPost(null);
      toast.success("Post atualizado");
    },
  });

  const handleGenerate = async (topic?: string) => {
    setGenerating(true);
    setShowTopicDialog(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-post", {
        body: topic ? { topic } : {},
      });
      if (error) throw error;
      toast.success(`Post criado: ${data?.post?.title || "Novo artigo"}`);
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    } catch (err: any) {
      toast.error(`Erro na geração: ${err.message}`);
    } finally {
      setGenerating(false);
      setCustomTopic("");
    }
  };

  const openEdit = (post: BlogPost) => {
    setEditPost(post);
    setEditTitle(post.title);
    setEditExcerpt(post.excerpt || "");
    setEditStatus(post.status);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      published: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      draft: "bg-amber-500/10 text-amber-600 border-amber-200",
      archived: "bg-muted text-muted-foreground",
    };
    const labels: Record<string, string> = { published: "Publicado", draft: "Rascunho", archived: "Arquivado" };
    return <Badge variant="outline" className={map[status] || ""}>{labels[status] || status}</Badge>;
  };

  const totalViews = (posts || []).reduce((sum, p) => sum + (p.views_count || 0), 0);
  const publishedCount = (posts || []).filter(p => p.status === "published").length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{posts?.length || 0}</p><p className="text-xs text-muted-foreground">Total Posts</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{publishedCount}</p><p className="text-xs text-muted-foreground">Publicados</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalViews}</p><p className="text-xs text-muted-foreground">Views Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalViews > 0 && publishedCount > 0 ? Math.round(totalViews / publishedCount) : 0}</p><p className="text-xs text-muted-foreground">Média/Post</p></CardContent></Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">Posts do Blog</CardTitle>
            <div className="flex gap-2">
              <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={generating}>
                    <Plus className="w-4 h-4 mr-1" /> Tópico Custom
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Gerar post com tópico específico</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Label>Tópico</Label>
                    <Input value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} placeholder="Ex: Amamentação noturna para mães de primeira viagem" />
                  </div>
                  <DialogFooter>
                    <Button onClick={() => handleGenerate(customTopic)} disabled={!customTopic.trim()}>
                      <Sparkles className="w-4 h-4 mr-1" /> Gerar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button size="sm" onClick={() => handleGenerate()} disabled={generating}>
                {generating ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                {generating ? "Gerando..." : "Gerar Automático"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Buscar por título..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
                <SelectItem value="draft">Rascunhos</SelectItem>
                <SelectItem value="archived">Arquivados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-8"><RefreshCw className="animate-spin h-5 w-5 text-muted-foreground" /></div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead field="title" label="Título" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <TableHead className="w-[100px]">Status</TableHead>
                    <SortableTableHead field="views_count" label="Views" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="w-[80px]" />
                    <SortableTableHead field="created_at" label="Criado" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="w-[100px]" />
                    <TableHead className="w-[140px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum post encontrado</TableCell></TableRow>
                  ) : filtered.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[300px]">
                          {post.is_ai_generated && <Sparkles className="w-3 h-3 text-primary shrink-0" />}
                          <span className="truncate text-sm font-medium">{post.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(post.status)}</TableCell>
                      <TableCell className="text-sm">{post.views_count || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(post.created_at), "dd/MM/yy", { locale: ptBR })}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(post)} title="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {post.status === "published" ? (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleStatusMutation.mutate({ id: post.id, newStatus: "draft" })} title="Despublicar">
                              <EyeOff className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleStatusMutation.mutate({ id: post.id, newStatus: "published" })} title="Publicar">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {post.status === "published" && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" asChild title="Ver no blog">
                              <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if (confirm("Excluir este post?")) deleteMutation.mutate(post.id); }} title="Excluir">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editPost} onOpenChange={(open) => !open && setEditPost(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Post</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></div>
            <div><Label>Resumo</Label><Textarea value={editExcerpt} onChange={(e) => setEditExcerpt(e.target.value)} rows={3} /></div>
            <div>
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPost(null)}>Cancelar</Button>
            <Button onClick={() => editPost && updateMutation.mutate({ id: editPost.id, title: editTitle, excerpt: editExcerpt, status: editStatus })}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
