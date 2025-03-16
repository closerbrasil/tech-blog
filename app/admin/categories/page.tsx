import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  FormDescription,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Loader2, PlusCircle } from "lucide-react";
import type { Categoria, InsertCategoria } from "@shared/schema";
import { insertCategoriaSchema } from "@shared/schema";
import AdminLayout from "@/layouts/AdminLayout";
import { Badge } from "@/components/ui/badge";

// Estender o schema para adicionar validações específicas
const categoriaSchema = insertCategoriaSchema.extend({
  nome: z.string().min(3, "O nome precisa ter pelo menos 3 caracteres"),
  descricao: z.string().min(10, "A descrição precisa ter pelo menos 10 caracteres"),
  cor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, {
    message: "A cor deve ser um valor hexadecimal válido (ex: #3b82f6)"
  }),
});

type FormValues = z.infer<typeof categoriaSchema>;

export default function CategoriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Categoria | null>(null);
  
  // Inicializar o formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: "",
      slug: "",
      descricao: "",
      cor: "#3b82f6", // Azul por padrão
    },
  });

  // Buscar categorias
  const { data: categorias, isLoading } = useQuery<Categoria[]>({
    queryKey: ["/api/categorias"],
  });

  // Mutação para criar/editar categoria
  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (selectedCategory) {
        // Editar categoria existente
        const res = await fetch(`/api/categorias/${selectedCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Falha ao atualizar categoria");
        return res.json();
      } else {
        // Criar nova categoria
        const res = await fetch("/api/categorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Falha ao criar categoria");
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias"] });
      toast({
        title: selectedCategory ? "Categoria atualizada" : "Categoria criada",
        description: selectedCategory
          ? "A categoria foi atualizada com sucesso"
          : "A nova categoria foi criada com sucesso",
      });
      form.reset();
      setIsDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Mutação para excluir categoria
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categorias/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao excluir categoria");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias"] });
      toast({
        title: "Categoria excluída",
        description: "A categoria foi removida permanentemente",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir categoria",
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
      descricao: "",
      cor: "#3b82f6", // Azul padrão
    });
    setSelectedCategory(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (categoria: Categoria) => {
    form.reset({
      nome: categoria.nome,
      slug: categoria.slug,
      descricao: categoria.descricao || "",
      cor: categoria.cor || "#3b82f6",
    });
    setSelectedCategory(categoria);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (categoria: Categoria) => {
    setSelectedCategory(categoria);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id);
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
        title="Gerenciar Categorias | Admin"
        description="Gerencie as categorias do portal de notícias"
      />

      <AdminLayout title="Gerenciar Categorias">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-500">
            Gerencie todas as categorias do portal de notícias
          </p>
          <Button onClick={handleCreateClick} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Nova Categoria
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
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias && categorias.length > 0 ? (
                  categorias.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell className="font-medium">{categoria.nome}</TableCell>
                      <TableCell>{categoria.slug}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {categoria.descricao}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-md"
                            style={{ backgroundColor: categoria.cor || "#3b82f6" }}
                          ></div>
                          <span className="text-sm text-gray-500 font-mono">
                            {categoria.cor || "#3b82f6"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(categoria)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(categoria)}
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
                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                      Nenhuma categoria encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Diálogo de criação/edição de categoria */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCategory ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
              <DialogDescription>
                {selectedCategory
                  ? "Edite os detalhes da categoria existente"
                  : "Crie uma nova categoria para organizar as notícias"}
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
                          placeholder="Nome da categoria"
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

                {/* Descrição */}
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição da categoria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cor */}
                <FormField
                  control={form.control}
                  name="cor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <div className="flex items-center gap-3">
                        <FormControl>
                          <Input 
                            type="color" 
                            placeholder="#3b82f6" 
                            {...field} 
                            className="w-16 h-10 p-1 cursor-pointer"
                          />
                        </FormControl>
                        <Input 
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="flex-1"
                          placeholder="#3b82f6"
                        />
                        <div 
                          className="h-10 w-24 rounded-md flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: field.value || "#3b82f6" }}
                        >
                          Preview
                        </div>
                      </div>
                      <FormDescription>
                        Escolha uma cor para a etiqueta da categoria.
                      </FormDescription>
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
                    ) : selectedCategory ? (
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
                Tem certeza que deseja excluir a categoria "{selectedCategory?.nome}"? 
                Esta ação não pode ser desfeita e pode afetar notícias associadas a esta categoria.
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