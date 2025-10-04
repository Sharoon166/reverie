'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateQuarter } from '@/app/actions/quarters';
import type { Quarter } from '@/types/quarter';

interface ClientTargetsDialogProps {
  open: boolean;
  quarter: Quarter | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ClientTargetsDialog({
  open,
  quarter,
  onOpenChange,
  onSuccess,
}: ClientTargetsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [targets, setTargets] = useState({
    clientAcquisitionTarget: 0,
    highValueClientsTarget: 0,
  });

  useEffect(() => {
    if (quarter) {
      setTargets({
        clientAcquisitionTarget: quarter.clientAcquisitionTarget ?? 0,
        highValueClientsTarget: quarter.highValueClientsTarget ?? 0,
      });
    }
  }, [quarter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quarter) return;

    setIsLoading(true);
    try {
      await updateQuarter(quarter.$id, {
        clientAcquisitionTarget: Number(targets.clientAcquisitionTarget),
        highValueClientsTarget: Number(targets.highValueClientsTarget),
      });

      onOpenChange(false);
      onSuccess?.();
      toast.success('Client targets updated successfully');
    } catch (error) {
      console.error('Error updating client targets:', error);
      toast.error('Failed to update client targets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTargets(prev => ({
      ...prev,
      [name]: value === '' ? '' : Math.max(0, Number(value)),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update Client Targets</DialogTitle>
            <DialogDescription>
              Set your client acquisition targets for <span className="uppercase">{quarter?.quarterId}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="clientAcquisitionTarget">
                Client Acquisition Target
              </Label>
              <Input
                id="clientAcquisitionTarget"
                name="clientAcquisitionTarget"
                type="number"
                min="0"
                value={targets.clientAcquisitionTarget}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="highValueClientsTarget">
                High-Value Clients Target
              </Label>
              <Input
                id="highValueClientsTarget"
                name="highValueClientsTarget"
                type="number"
                min="0"
                value={targets.highValueClientsTarget}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
