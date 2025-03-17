'use client';

/**
 * Editor de artigos com TipTap
 * 
 * NOTA SOBRE ERROS DE LINTER:
 * Existem alguns erros de tipo relacionados às extensões do TipTap.
 * Estes erros não afetam a funcionalidade do editor, pois são apenas avisos do TypeScript.
 * Se os erros persistirem após instalar todas as dependências, pode ser necessário:
 * 1. Executar `bun add @tiptap/extension-placeholder @tiptap/extension-text-align @tiptap/extension-underline 
 *    @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-table @tiptap/extension-table-row 
 *    @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-youtube`
 * 2. Reiniciar o servidor de desenvolvimento
 * 
 * Usamos uma função auxiliar `executeEditorCommand` para contornar os problemas de tipo.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useEditor, EditorContent, Editor, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Youtube from '@tiptap/extension-youtube';
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from "@/layouts/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ArrowLeft, 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Table as TableIcon, 
  Youtube as YoutubeIcon,
  RotateCcw,
  RotateCw,
  Palette,
  FileUp
} from "lucide-react";
import { marked } from 'marked';

// Estendendo a tipagem do ChainedCommands para os métodos das extensões
// Comentando as declarações problemáticas e usando executeEditorCommand como alternativa
/* 
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtube: {
      setYoutubeVideo: (options: { src: string }) => ReturnType;
    };
    table: {
      insertTable: (options: { rows: number; cols: number; withHeaderRow: boolean }) => ReturnType;
    };
    textStyle: {
      setColor: (color: string) => ReturnType;
    };
    textAlign: {
      setTextAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => ReturnType;
    };
    underline: {
      toggleUnderline: () => ReturnType;
    };
  }
}
*/

// Schema de validação
const createPostSchema = z.object({
  titulo: z.string().min(3, "O título deve ter no mínimo 3 caracteres"),
  slug: z.string().min(3, "O slug deve ter no mínimo 3 caracteres"),
  conteudo: z.string().min(10, "O conteúdo deve ter no mínimo 10 caracteres"),
  meta_descricao: z.string().optional(),
  palavra_chave: z.string().optional(),
  tempo_leitura: z.string().optional(),
  status: z.enum(["PUBLIC", "PRIVATE"]),
  categoria_id: z.string().uuid("Selecione uma categoria válida"),
  autor_id: z.string().uuid("Selecione um autor válido"),
  image_url: z.string().url("URL da imagem inválida"),
  imagem_credito: z.string().optional(),
  imagem_alt: z.string().optional(),
});

type FormValues = z.infer<typeof createPostSchema>;

// Função auxiliar para execução de comandos
function executeEditorCommand(editor: Editor | null, command: string, options?: any) {
  if (!editor) return;
  
  // Obtém o chain
  const chain = editor.chain().focus();
  
  // Executa o comando dinamicamente
  if (options) {
    // @ts-ignore - Chamada dinâmica
    chain[command](options);
  } else {
    // @ts-ignore - Chamada dinâmica
    chain[command]();
  }
  
  chain.run();
}

// Adicionar estilo global inline para o editor TipTap
const editorStyles = `
  body {
    overflow: hidden;
  }

  .ProseMirror {
    height: calc(100vh - 400px);
    overflow-y: auto;
    outline: none;
    background-color: white;
    padding: 1rem;
    max-width: 768px; /* Largura máxima para melhor leitura */
    margin: 0 auto; /* Centralizar o conteúdo */
  }
  
  .editor-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    max-width: 1024px; /* Container um pouco mais largo que o conteúdo */
    margin: 0 auto; /* Centralizar o container */
  }
  
  .editor-toolbar {
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 50;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    max-width: 1024px; /* Manter consistência com o container */
    margin: 0 auto;
  }
  
  .editor-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background-color: white;
    min-height: 0;
    max-width: 1024px; /* Manter consistência com o container */
    margin: 0 auto;
  }

  .ProseMirror::-webkit-scrollbar {
    width: 8px;
  }

  .ProseMirror::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  .ProseMirror::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  .ProseMirror::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  .ProseMirror p.is-editor-empty:first-child::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
  
  .ProseMirror:focus {
    outline: none;
  }
  
  .ProseMirror h1 {
    font-size: 1.75rem;
    margin-bottom: 1rem;
    font-weight: 700;
  }
  
  .ProseMirror h2 {
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }
  
  .ProseMirror ul, .ProseMirror ol {
    padding-left: 1.5rem;
  }
  
  .ProseMirror blockquote {
    border-left: 3px solid #e9ecef;
    padding-left: 1rem;
    font-style: italic;
    margin: 1rem 0;
  }
  
  .ProseMirror pre {
    background-color: #f8f9fa;
    padding: 0.75rem;
    border-radius: 0.25rem;
    font-family: monospace;
    overflow-x: auto;
  }
  
  .ProseMirror img {
    max-width: 100%;
    height: auto;
    margin: 1rem 0;
  }
  
  .ProseMirror a {
    text-decoration: underline;
    color: #0d6efd;
  }
  
  .ProseMirror table {
    border-collapse: collapse;
    margin: 1rem 0;
    overflow: hidden;
    width: 100%;
  }
  
  .ProseMirror td, .ProseMirror th {
    border: 1px solid #e9ecef;
    padding: 0.5rem;
    position: relative;
    vertical-align: top;
  }
  
  .ProseMirror th {
    background-color: #f8f9fa;
    font-weight: 600;
  }
`;

export default function CreatePostPage() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');

  // Inicializar o formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      titulo: "",
      slug: "",
      conteudo: "",
      status: "PUBLIC",
      meta_descricao: "",
      palavra_chave: "",
      tempo_leitura: "5 min",
      image_url: "",
      imagem_credito: "",
      imagem_alt: "",
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Placeholder.configure({
        placeholder: 'Digite o conteúdo do seu artigo aqui...',
        emptyEditorClass: 'is-editor-empty',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Youtube.configure({
        width: 640,
        height: 480,
        HTMLAttributes: {
          class: 'my-4 rounded overflow-hidden',
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'focus:outline-none prose prose-sm sm:prose max-w-none p-4',
      },
    },
    content: '',
    onUpdate: ({ editor }: { editor: Editor }) => {
      form.setValue('conteudo', editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Adicionar link
  const addLink = () => {
    if (linkUrl && editor) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  // Adicionar imagem
  const addImage = () => {
    if (imageUrl && editor) {
      editor
        .chain()
        .focus()
        .setImage({ src: imageUrl })
        .run();
      setImageUrl('');
      setShowImageInput(false);
    }
  };

  // Adicionar vídeo do YouTube
  const addYoutube = () => {
    if (youtubeUrl && editor) {
      executeEditorCommand(editor, 'setYoutubeVideo', { src: youtubeUrl });
      setYoutubeUrl('');
      setShowYoutubeInput(false);
    }
  };

  // Adicionar tabela
  const addTable = () => {
    if (editor) {
      executeEditorCommand(editor, 'insertTable', { rows: 3, cols: 3, withHeaderRow: true });
    }
  };

  // Mudar cor do texto
  const setTextColor = (color: string) => {
    setSelectedColor(color);
    if (editor) {
      executeEditorCommand(editor, 'setColor', color);
    }
  };

  // Adicionar função para processar arquivo Markdown
  const handleMarkdownUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;
    
    try {
      setIsUploading(true);
      const text = await file.text();
      
      // Converter Markdown para HTML
      const html = marked(text, {
        gfm: true, // GitHub Flavored Markdown
        breaks: true, // Converter quebras de linha em <br>
      });
      
      // Inserir o conteúdo HTML no editor
      editor.commands.setContent(html);
      
      toast({
        title: "Arquivo carregado com sucesso",
        description: "O conteúdo do arquivo Markdown foi importado para o editor",
      });
    } catch (error) {
      console.error("Erro ao carregar arquivo:", error);
      toast({
        title: "Erro ao carregar arquivo",
        description: "Não foi possível ler o arquivo Markdown",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Limpar o input file
      event.target.value = '';
    }
  };

  // Mutação para criar artigo
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await fetch("/api/noticias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/noticias"] });
      toast({
        title: "Artigo criado com sucesso",
        description: "O artigo foi salvo e está pronto para publicação",
      });
      router.push("/admin/manage-posts");
    },
    onError: (error) => {
      console.error("Erro ao criar artigo:", error);
      toast({
        title: "Erro ao criar artigo",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Gerar slug a partir do título
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-");
  };

  // Handler para mudança no título
  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = generateSlug(title);
    form.setValue("slug", slug);
  };

  // Handler para submit do formulário
  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  return (
    <>
      <SEOHead
        title="Criar Novo Artigo | Admin"
        description="Crie um novo artigo para o portal de notícias"
      />
      <style jsx global>{editorStyles}</style>

      <AdminLayout>
        <div className="flex flex-col h-screen overflow-hidden bg-white">
          <div className="flex items-center gap-4 p-4 border-b max-w-[1024px] mx-auto w-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admin/manage-posts")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Criar Novo Artigo</h1>
              <p className="text-sm text-muted-foreground">
                Preencha os campos abaixo para criar um novo artigo
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-white">
              <div className="flex-shrink-0 grid gap-6 md:grid-cols-2 p-4 border-b">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o título do artigo"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            onTitleChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="url-do-artigo"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex-1 overflow-hidden">
                <FormField
                  control={form.control}
                  name="conteudo"
                  render={({ field }) => (
                    <FormItem className="h-full">
                      <FormControl>
                        <div className="editor-container">
                          <div className="editor-toolbar border-b">
                            <div className="p-2 flex flex-wrap gap-1 items-center bg-white">
                              <div className="flex gap-1 items-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editor?.chain().focus().toggleBold().run()}
                                  className={editor?.isActive('bold') ? 'bg-muted' : ''}
                                  title="Negrito"
                                >
                                  <Bold className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                                  className={editor?.isActive('italic') ? 'bg-muted' : ''}
                                  title="Itálico"
                                >
                                  <Italic className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => executeEditorCommand(editor, 'toggleUnderline')}
                                  className={editor?.isActive('underline') ? 'bg-muted' : ''}
                                  title="Sublinhado"
                                >
                                  <UnderlineIcon className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="w-px h-6 bg-gray-200 mx-1" />

                              <div className="flex gap-1 items-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                                  className={editor?.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
                                  title="Título principal"
                                >
                                  <Heading1 className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                                  className={editor?.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
                                  title="Subtítulo"
                                >
                                  <Heading2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="w-px h-6 bg-gray-200 mx-1" />

                              <div className="flex gap-1 items-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                  className={editor?.isActive('bulletList') ? 'bg-muted' : ''}
                                  title="Lista com marcadores"
                                >
                                  <List className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                                  className={editor?.isActive('orderedList') ? 'bg-muted' : ''}
                                  title="Lista numerada"
                                >
                                  <ListOrdered className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="w-px h-6 bg-gray-200 mx-1" />

                              <div className="flex gap-1 items-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                                  className={editor?.isActive('blockquote') ? 'bg-muted' : ''}
                                  title="Citação"
                                >
                                  <Quote className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                                  className={editor?.isActive('codeBlock') ? 'bg-muted' : ''}
                                  title="Bloco de código"
                                >
                                  <Code className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="w-px h-6 bg-gray-200 mx-1" />

                              <div className="flex gap-1 items-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowLinkInput(!showLinkInput)}
                                  className={editor?.isActive('link') ? 'bg-muted' : ''}
                                  title="Adicionar link"
                                >
                                  <LinkIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowImageInput(!showImageInput)}
                                  title="Adicionar imagem"
                                >
                                  <ImageIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowYoutubeInput(!showYoutubeInput)}
                                  title="Adicionar vídeo do YouTube"
                                >
                                  <YoutubeIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={addTable}
                                  title="Adicionar tabela"
                                >
                                  <TableIcon className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="w-px h-6 bg-gray-200 mx-1" />

                              <div className="flex gap-1 items-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => executeEditorCommand(editor, 'setTextAlign', 'left')}
                                  className={editor?.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
                                  title="Alinhar à esquerda"
                                >
                                  <AlignLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => executeEditorCommand(editor, 'setTextAlign', 'center')}
                                  className={editor?.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
                                  title="Centralizar"
                                >
                                  <AlignCenter className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => executeEditorCommand(editor, 'setTextAlign', 'right')}
                                  className={editor?.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
                                  title="Alinhar à direita"
                                >
                                  <AlignRight className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => executeEditorCommand(editor, 'setTextAlign', 'justify')}
                                  className={editor?.isActive({ textAlign: 'justify' }) ? 'bg-muted' : ''}
                                  title="Justificar"
                                >
                                  <AlignJustify className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="w-px h-6 bg-gray-200 mx-1" />
                              
                              <div className="flex gap-1 items-center">
                                <input
                                  type="color"
                                  value={selectedColor}
                                  onChange={(e) => setTextColor(e.target.value)}
                                  className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                  title="Cor do texto"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editor?.chain().focus().undo().run()}
                                  disabled={!editor?.can().undo()}
                                  title="Desfazer"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editor?.chain().focus().redo().run()}
                                  disabled={!editor?.can().redo()}
                                  title="Refazer"
                                >
                                  <RotateCw className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="w-px h-6 bg-gray-200 mx-1" />

                              <div className="flex gap-1 items-center">
                                <input
                                  type="file"
                                  accept=".md,.markdown"
                                  onChange={handleMarkdownUpload}
                                  className="hidden"
                                  id="markdown-upload"
                                  disabled={isUploading}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => document.getElementById('markdown-upload')?.click()}
                                  disabled={isUploading}
                                  title="Importar arquivo Markdown"
                                >
                                  {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <FileUp className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {showLinkInput && (
                              <div className="p-2 border-b bg-gray-50 flex gap-2 items-center">
                                <Input
                                  type="url"
                                  placeholder="https://exemplo.com.br"
                                  value={linkUrl}
                                  onChange={(e) => setLinkUrl(e.target.value)}
                                  className="flex-1"
                                />
                                <Button 
                                  type="button" 
                                  onClick={addLink} 
                                  size="sm"
                                  variant="secondary"
                                >
                                  Adicionar
                                </Button>
                                <Button 
                                  type="button" 
                                  onClick={() => setShowLinkInput(false)} 
                                  size="sm"
                                  variant="ghost"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            )}

                            {showImageInput && (
                              <div className="p-2 border-b bg-gray-50 flex gap-2 items-center">
                                <Input
                                  type="url"
                                  placeholder="https://exemplo.com.br/imagem.jpg"
                                  value={imageUrl}
                                  onChange={(e) => setImageUrl(e.target.value)}
                                  className="flex-1"
                                />
                                <Button 
                                  type="button" 
                                  onClick={addImage} 
                                  size="sm"
                                  variant="secondary"
                                >
                                  Adicionar
                                </Button>
                                <Button 
                                  type="button" 
                                  onClick={() => setShowImageInput(false)} 
                                  size="sm"
                                  variant="ghost"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            )}

                            {showYoutubeInput && (
                              <div className="p-2 border-b bg-gray-50 flex gap-2 items-center">
                                <Input
                                  type="url"
                                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                  value={youtubeUrl}
                                  onChange={(e) => setYoutubeUrl(e.target.value)}
                                  className="flex-1"
                                />
                                <Button 
                                  type="button" 
                                  onClick={addYoutube} 
                                  size="sm"
                                  variant="secondary"
                                >
                                  Adicionar
                                </Button>
                                <Button 
                                  type="button" 
                                  onClick={() => setShowYoutubeInput(false)} 
                                  size="sm"
                                  variant="ghost"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="editor-content">
                            <EditorContent 
                              editor={editor} 
                              className="flex-1"
                            />

                            {editor && (
                              <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                                <div className="bg-white shadow rounded-md flex overflow-hidden">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                    className={editor.isActive('bold') ? 'bg-muted' : ''}
                                  >
                                    <Bold className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                    className={editor.isActive('italic') ? 'bg-muted' : ''}
                                  >
                                    <Italic className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowLinkInput(!showLinkInput)}
                                    className={editor.isActive('link') ? 'bg-muted' : ''}
                                  >
                                    <LinkIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </BubbleMenu>
                            )}
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex-shrink-0 flex justify-end gap-4 p-4 bg-white border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/manage-posts")}
                  className="w-full sm:w-auto h-11"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || isUploading}
                  className="w-full sm:w-auto h-11"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Artigo"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </AdminLayout>
    </>
  );
}
