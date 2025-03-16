import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Eye, Trash2 } from "lucide-react";

interface Column {
  header: string;
  key: string;
  render?: (item: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onDelete?: (id: string) => void;
  getViewUrl?: (item: any) => string;
  getEditUrl?: (item: any) => string;
  selectedItems?: string[];
  onItemSelect?: (id: string) => void;
  onSelectAll?: () => void;
  getId: (item: any) => string;
}

export function DataTable({
  data,
  columns,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onDelete,
  getViewUrl,
  getEditUrl,
  selectedItems = [],
  onItemSelect,
  onSelectAll,
  getId
}: DataTableProps) {
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {onItemSelect && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={data.length > 0 && selectedItems.length === data.length}
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.key}>{column.header}</TableHead>
              ))}
              <TableHead className="w-28">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={getId(item)}>
                {onItemSelect && (
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(getId(item))}
                      onCheckedChange={() => onItemSelect(getId(item))}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={`${getId(item)}-${column.key}`}>
                    {column.render ? column.render(item) : item[column.key]}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getViewUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <a href={getViewUrl(item)} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {getEditUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <a href={getEditUrl(item)}>
                          <Edit2 className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(getId(item))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
} 