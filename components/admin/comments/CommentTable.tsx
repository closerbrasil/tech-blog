import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Trash2, Eye, Link as LinkIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Comentario {
  id: string
  conteudo: string
  autorNome: string
  email: string
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO'
  criadoEm: string
  noticia?: {
    titulo?: string
    slug?: string
  }
}

interface CommentTableProps {
  comentarios: Comentario[]
  onAprovar: (id: string) => void
  onRejeitar: (id: string) => void
  onExcluir: (id: string) => void
}

export function CommentTable({ comentarios, onAprovar, onRejeitar, onExcluir }: CommentTableProps) {
  const [expandedComments, setExpandedComments] = useState<string[]>([])

  const toggleExpand = (id: string) => {
    setExpandedComments(prev => 
      prev.includes(id) 
        ? prev.filter(commentId => commentId !== id)
        : [...prev, id]
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROVADO':
        return <Badge className="bg-green-500">Aprovado</Badge>
      case 'REJEITADO':
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge variant="outline">Pendente</Badge>
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Autor</TableHead>
          <TableHead>Comentário</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Notícia</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {comentarios.map((comentario) => (
          <TableRow key={comentario.id}>
            <TableCell>
              <div>
                <p className="font-medium">{comentario.autorNome}</p>
                <p className="text-sm text-gray-500">{comentario.email}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="max-w-md">
                <p className={expandedComments.includes(comentario.id) ? "" : "line-clamp-2"}>
                  {comentario.conteudo}
                </p>
                {comentario.conteudo.length > 100 && (
                  <button
                    onClick={() => toggleExpand(comentario.id)}
                    className="text-sm text-blue-500 hover:text-blue-700 mt-1"
                  >
                    {expandedComments.includes(comentario.id) ? "Ver menos" : "Ver mais"}
                  </button>
                )}
              </div>
            </TableCell>
            <TableCell>{getStatusBadge(comentario.status)}</TableCell>
            <TableCell>
              {formatDistanceToNow(new Date(comentario.criadoEm), {
                addSuffix: true,
                locale: ptBR
              })}
            </TableCell>
            <TableCell>
              {comentario.noticia && (
                <a
                  href={`/noticia/${comentario.noticia.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-500 hover:text-blue-700"
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  {comentario.noticia.titulo}
                </a>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {comentario.status === 'PENDENTE' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAprovar(comentario.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onExcluir(comentario.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 