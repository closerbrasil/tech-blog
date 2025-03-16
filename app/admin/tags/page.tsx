import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Loader2, PlusCircle, Tag } from "lucide-react";
import type { Tag as TagType, InsertTag } from "@shared/schema";
import { insertTagSchema } from "@shared/schema";

// Estender o schema para adicionar validações específicas
const tagSchema = insertTagSchema.extend({
  nome: z.string().min(2, "O nome precisa ter pelo menos 2 caracteres"),
});

type FormValues = z.infer<typeof tagSchema>;

export default function TagsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagType | null>(null);
  
  // Inicializar o formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      nome: "",
      slug: "",
    },
  });

  // Buscar tags
  const { data: tags, isLoading } = useQuery<TagType[]>({
    queryKey: ["/api/tags"],
  });

  // Mutação para criar/editar tag
  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (selectedTag) {
        // Editar tag existente
        const res = await fetch(`/api/tags/${selectedTag.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Falha ao atualizar tag");
        return res.json();
      } else {
        // Criar nova tag
        const res = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Falha ao criar tag");
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({
        title: selectedTag ? "Tag atualizada" : "Tag criada",
        description: selectedTag
          ? "A tag foi atualizada com sucesso"
          : "A nova tag foi criada com sucesso",
      });
      form.reset();
      setIsDialogOpen(false);
      setSelectedTag(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Mutação para excluir tag
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao excluir tag");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({
        title: "Tag excluída",
        description: "A tag foi removida permanentemente",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir tag",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Gerar slug a partir do nome
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-");
  };

  // Manipuladores
  const handleCreateClick = () => {
    form.reset({
      nome: "",
      slug: "",
    });
    setSelectedTag(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (tag: TagType) => {
    form.reset({
      nome: tag.nome,
      slug: tag.slug,
    });
    setSelectedTag(tag);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (tag: TagType) => {
    setSelectedTag(tag);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTag) {
      deleteMutation.mutate(selectedTag.id);
    }
  };

  const onSubmit = (values: FormValues) => {
    saveMutation.mutate(values);
  };

  // Atualizar o slug quando o nome mudar
  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("slug", generateSlug(name));
  };

  return (
    <>
      <SEOHead
        title="Gerenciar Tags | Admin"
        description="Gerencie as tags do portal de notícias"
      />

      <AdminLayout title="Gerenciar Tags">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-500">
            Gerencie todas as tags utilizadas para classificar as notícias
          </p>
          <Button onClick={handleCreateClick} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Nova Tag
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags && tags.length > 0 ? (
                  tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-primary" />
                          {tag.nome}
                        </div>
                      </TableCell>
                      <TableCell>{tag.slug}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(tag)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(tag)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-gray-500">
                      Nenhuma tag encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Diálogo de criação/edição de tag */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedTag ? "Editar Tag" : "Nova Tag"}
              </DialogTitle>
              <DialogDescription>
                {selectedTag
                  ? "Edite os detalhes da tag existente"
                  : "Crie uma nova tag para classificar notícias"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Nome */}
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome da tag"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            onNameChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Slug */}
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="url-amigavel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={saveMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : selectedTag ? (
                      "Atualizar"
                    ) : (
                      "Criar"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmação de exclusão */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir a tag "{selectedTag?.nome}"? 
                Esta ação não pode ser desfeita e vai remover esta tag de todas as notícias associadas.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}