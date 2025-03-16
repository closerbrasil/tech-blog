'use client'

import { FileText, Code, Video, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/layouts/AdminLayout";
import { StatsCard } from "@/components/admin";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRoutes, type NoticiasResponse, type Video as VideoType } from "@/lib/api";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

export default function AdminDashboard() {
  const { data: noticias, isLoading: noticiasLoading, error: noticiasError } = useQuery({
    queryKey: ["/api/noticias"],
    queryFn: apiRoutes.noticias.list
  });
  
  const { data: videos, isLoading: videosLoading, error: videosError } = useQuery({
    queryKey: ["/api/videos"],
    queryFn: apiRoutes.videos.list
  });

  return (
    <>
      <SEOHead
        title="Dashboard Admin | Portal de Notícias"
        description="Painel de controle administrativo do portal de notícias"
      />
      
      <div className="space-y-6">
        {/* Grid de Estatísticas */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          initial="initial"
          animate="animate"
          variants={fadeIn}
        >
          <StatsCard
            title="Total de Artigos"
            value={noticiasLoading ? "0" : noticias?.total || 0}
            icon={<FileText className="h-6 w-6 text-primary" />}
            loading={noticiasLoading}
          />
          
          <StatsCard
            title="Vídeos"
            value={videosLoading ? "0" : (videos?.videos?.length || 0)}
            icon={<Video className="h-6 w-6 text-primary" />}
            loading={videosLoading}
          />
        </motion.div>

        {/* Seção de Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Artigos Recentes */}
          <motion.div 
            className="border rounded-lg p-4 bg-card"
            {...fadeIn}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Artigos Recentes
            </h3>
            
            {noticiasError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Erro ao carregar artigos. Tente novamente mais tarde.
                </AlertDescription>
              </Alert>
            ) : noticiasLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2 pr-4">
                  {(noticias?.noticias ?? []).map((noticia) => (
                    <motion.div 
                      key={noticia.id}
                      className="p-3 bg-card-foreground/5 hover:bg-card-foreground/10 border border-border rounded-md flex justify-between items-center transition-colors"
                      whileHover={{ scale: 1.01 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span className="font-medium truncate max-w-[70%]">{noticia.titulo}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(noticia.publicado_em).toLocaleDateString('pt-BR')}
                      </span>
                    </motion.div>
                  ))}
                  {(noticias?.noticias ?? []).length === 0 && (
                    <div className="text-muted-foreground text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma notícia encontrada</p>
                      <Button variant="outline" size="sm" className="mt-4">
                        Criar Novo Artigo
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </motion.div>

          {/* Estatísticas */}
          <motion.div 
            className="border rounded-lg p-4 bg-card"
            {...fadeIn}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Estatísticas
            </h3>
            <div className="text-muted-foreground">
              <p>As estatísticas detalhadas estarão disponíveis em breve.</p>
            </div>
          </motion.div>
        </div>
        
        {/* Documentação da API */}
        <motion.div 
          className="border rounded-lg p-6 bg-card"
          {...fadeIn}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center mb-4">
            <Code className="h-6 w-6 text-primary mr-2" />
            <h3 className="text-lg font-medium">Parâmetros da API</h3>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Utilize os modelos abaixo para fazer requisições à API. 
            Clique em "Copiar modelo" para obter o JSON pronto para uso.
          </p>
          
          <ScrollArea className="h-[400px]">
            <div className="space-y-6 pr-4">
              {/* Endpoints da API */}
              {[
                {
                  method: "POST",
                  endpoint: "/api/noticias",
                  model: {
                    titulo: "Título da Notícia",
                    slug: "titulo-da-noticia",
                    resumo: "Resumo ou descrição curta do conteúdo",
                    conteudo: "<p>Conteúdo completo da notícia em HTML</p>",
                    imageUrl: "/url/para/imagem-principal.jpg",
                    autorId: "id-do-autor",
                    categoriaId: "id-da-categoria",
                    status: "publicado",
                    visibilidade: "publico",
                    metaTitulo: "Título para SEO (opcional)",
                    metaDescricao: "Descrição para SEO (opcional)",
                    tempoLeitura: "5 min"
                  }
                },
                {
                  method: "PATCH",
                  endpoint: "/api/noticias/:id",
                  model: {
                    titulo: "Título Atualizado",
                    resumo: "Resumo atualizado",
                    status: "publicado"
                  }
                },
                {
                  method: "POST",
                  endpoint: "/api/autores",
                  model: {
                    nome: "Nome do Autor",
                    slug: "nome-do-autor",
                    bio: "Biografia do autor",
                    avatarUrl: "/url/para/avatar.jpg",
                    cargo: "Jornalista",
                    email: "autor@email.com"
                  }
                },
                {
                  method: "POST",
                  endpoint: "/api/categorias",
                  model: {
                    nome: "Nome da Categoria",
                    slug: "nome-da-categoria",
                    descricao: "Descrição da categoria"
                  }
                }
              ].map((api, index) => (
                <motion.div 
                  key={api.endpoint}
                  className="bg-card-foreground/5 rounded-lg p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <code className="text-primary font-medium">
                      {api.method} {api.endpoint}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(api.model, null, 2));
                        // Adicionar toast de sucesso aqui
                      }}
                    >
                      Copiar modelo
                    </Button>
                  </div>
                  <pre className="bg-black rounded p-4 overflow-x-auto">
                    <code className="text-green-400 text-sm">
                      {JSON.stringify(api.model, null, 2)}
                    </code>
                  </pre>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      </div>
    </>
  );
}