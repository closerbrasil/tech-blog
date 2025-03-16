import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"

interface Automacao {
  id: string
  nome: string
  descricao: string
  tipo: string
  ativo: boolean
  configuracao: string
  ultimaExecucao: string | null
  criadoEm: string
  atualizadoEm: string
}

interface AutomacaoCardProps {
  automacao: Automacao
  isUpdating: boolean
  onToggle: (id: string, checked: boolean) => void
  onClick?: () => void
  isSelected?: boolean
}

export function AutomacaoCard({ 
  automacao, 
  isUpdating, 
  onToggle, 
  onClick,
  isSelected = false 
}: AutomacaoCardProps) {
  return (
    <div
      className={`bg-white border rounded-lg p-4 ${
        isSelected ? 'border-primary ring-1 ring-primary' : ''
      } ${onClick ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">{automacao.nome}</h4>
            <p className="text-sm text-gray-500">{automacao.descricao}</p>
            {automacao.ultimaExecucao && (
              <p className="text-xs text-gray-400 mt-1">
                Última execução: {new Date(automacao.ultimaExecucao).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <>
                <span className="text-sm text-gray-500">
                  {automacao.ativo ? "Ativo" : "Inativo"}
                </span>
                <Switch
                  checked={automacao.ativo}
                  disabled={isUpdating}
                  onCheckedChange={(checked) => onToggle(automacao.id, checked)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 