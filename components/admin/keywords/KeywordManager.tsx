import { useState, useRef } from "react"
import { Search, Filter, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Keyword {
  id: string
  topic: string
  status: string
  criadoEm: string
}

interface KeywordManagerProps {
  keywords: Keyword[]
  isLoading: boolean
  onSearch: (term: string) => void
  onStatusFilter: (status: string) => void
  onSelect: (id: string) => void
  onSelectAll: (checked: boolean) => void
  selectedIds: string[]
  onEdit: (keyword: Keyword) => void
  onDelete: (id: string) => void
}

export function KeywordManager({
  keywords,
  isLoading,
  onSearch,
  onStatusFilter,
  onSelect,
  onSelectAll,
  selectedIds,
  onEdit,
  onDelete,
}: KeywordManagerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      onSearch(value)
    }, 500)
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'POSTED':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Publicado</Badge>
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>
      case 'ERROR':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Erro</Badge>
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Não Publicado</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar palavras-chave..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        
        <Select onValueChange={onStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar por status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="NOT_POSTED">Não Publicados</SelectItem>
            <SelectItem value="PENDING">Pendentes</SelectItem>
            <SelectItem value="POSTED">Publicados</SelectItem>
            <SelectItem value="ERROR">Com Erro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {keywords.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={keywords.length > 0 && selectedIds.length === keywords.length}
                    onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                  />
                </TableHead>
                <TableHead>Palavra-chave</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keywords.map((keyword) => (
                <TableRow key={keyword.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(keyword.id)}
                      onCheckedChange={() => onSelect(keyword.id)}
                    />
                  </TableCell>
                  <TableCell>{keyword.topic}</TableCell>
                  <TableCell>{renderStatusBadge(keyword.status)}</TableCell>
                  <TableCell>
                    {new Date(keyword.criadoEm).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(keyword)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(keyword.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Nenhuma palavra-chave encontrada
        </div>
      )}
    </div>
  )
} 