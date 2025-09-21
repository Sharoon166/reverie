'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface CSVImportProps {
  onImport: (data: Record<string, unknown>[]) => void;
  expectedColumns: string[];
  entityName: string;
  sampleData: Record<string, unknown>;
}

export default function CSVImport({ onImport, expectedColumns, entityName, sampleData }: CSVImportProps) {
  const [open, setOpen] = useState(false);
  const [csvData, setCsvData] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please select a valid CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error('CSV file must contain at least a header and one data row');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });

        setCsvData(data);
        toast.success(`Loaded ${data.length} records from CSV`);
      } catch (error) {
        console.error('CSV parsing error:', error);
        toast.error('Failed to parse CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (csvData.length === 0) {
      toast.error('No data to import. Please upload a CSV file first.');
      return;
    }

    setIsLoading(true);
    try {
      onImport(csvData);
      toast.success(`Successfully imported ${csvData.length} ${entityName.toLowerCase()}s`);
      setOpen(false);
      setCsvData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const headers = expectedColumns.join(',');
    const sampleRow = expectedColumns.map(col => sampleData[col] || '').join(',');
    const csvContent = `${headers}\n${sampleRow}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityName.toLowerCase()}-sample.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Import CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[90vw] max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import {entityName}s from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple {entityName.toLowerCase()}s at once.
          </DialogDescription>
        </DialogHeader>

        {/* Upload Zone */}
        <div 
          className="mt-4 flex h-28 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 mb-2" />
            <p>Drop CSV file here or click to upload</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Info Box */}
        <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
          <p className="font-medium">Expected CSV Format</p>
          <p>
            Your CSV should include these columns:{' '}
            <span className="font-mono">
              {expectedColumns.join(', ')}
            </span>
          </p>
          <button
            onClick={downloadSampleCSV}
            className="mt-1 inline-block text-blue-600 hover:underline"
          >
            Download sample CSV template
          </button>
        </div>

        {/* Preview Table */}
        {csvData.length > 0 && (
          <div className="mt-6 max-h-64 overflow-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 sticky top-0">
                <tr>
                  {expectedColumns.map((col) => (
                    <th key={col} className="px-4 py-2 font-medium capitalize">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {csvData.slice(0, 5).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {expectedColumns.map((col) => (
                      <td key={col} className="px-4 py-2">
                        {String(row[col] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 5 && (
              <div className="p-2 text-center text-sm text-gray-500 bg-gray-50">
                ... and {csvData.length - 5} more rows
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isLoading || csvData.length === 0}>
            {isLoading ? 'Importing...' : `Import ${csvData.length} ${entityName}s`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}