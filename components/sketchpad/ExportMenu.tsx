'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Download, FileJson, FileImage, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportCurrentDrawing, exportCurrentNotebook, parseNotebookFile } from '@/lib/sketch/export';
import { replaceNotebook } from '@/lib/storage/notebook-db';
import { useSketchStore } from '@/lib/store/sketch-store';
import type { NotebookDoc } from '@/lib/sketch/types';
import { IconButton } from './IconButton';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

export function ExportMenu() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<NotebookDoc | null>(null);
  const [importing, setImporting] = useState(false);

  const handleExportDrawing = () => {
    exportCurrentDrawing().catch((error: unknown) =>
      toast({ title: 'Export failed', description: errorMessage(error), variant: 'destructive' })
    );
  };

  const handleFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setPendingImport(parseNotebookFile(await file.text()));
    } catch (error) {
      toast({ title: 'Import failed', description: errorMessage(error), variant: 'destructive' });
    }
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    setImporting(true);
    try {
      await replaceNotebook(pendingImport);
      useSketchStore.getState().load(pendingImport, useSketchStore.getState().preferences);
      toast({ title: 'Notebook imported' });
    } catch (error) {
      toast({ title: 'Import failed', description: errorMessage(error), variant: 'destructive' });
    } finally {
      setImporting(false);
      setPendingImport(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton label="Export and import">
            <Download className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5">
          <DropdownMenuItem onSelect={handleExportDrawing} className="gap-2.5 rounded-lg py-2">
            <FileImage className="h-4 w-4" aria-hidden="true" />
            <span className="flex-1">Export drawing as PNG</span>
            <span className="text-xs text-muted-foreground">Ctrl+E</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportCurrentNotebook} className="gap-2.5 rounded-lg py-2">
            <FileJson className="h-4 w-4" aria-hidden="true" />
            <span>Export notebook (.sketchpad)</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => fileInputRef.current?.click()} className="gap-2.5 rounded-lg py-2">
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>Import notebook</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".sketchpad,application/json"
        className="hidden"
        onChange={handleFileChosen}
      />

      <AlertDialog open={pendingImport !== null} onOpenChange={(open) => !open && setPendingImport(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the current notebook?</AlertDialogTitle>
            <AlertDialogDescription>
              Importing replaces the notebook open in this browser. Export it first if you want to keep a copy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={confirmImport} disabled={importing}>
                Replace notebook
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
