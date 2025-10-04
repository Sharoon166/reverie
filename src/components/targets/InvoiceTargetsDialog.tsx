'client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateQuarter } from '@/app/actions/quarters';
import type { Quarter } from '@/types/quarter';

interface InvoiceTargetsDialogProps {
  open: boolean;
  quarter: Quarter | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InvoiceTargetsDialog({
  open,
  quarter,
  onOpenChange,
  onSuccess,
}: InvoiceTargetsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [target, setTarget] = useState({
    quarterlyRevenueCollectionTarget: 0,
  });

  useEffect(() => {
    if (quarter) {
      setTarget({
        quarterlyRevenueCollectionTarget: quarter.quarterlyRevenueCollectionTarget ?? 0,
      });
    }
  }, [quarter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quarter) return;

    setIsLoading(true);
    try {
      await updateQuarter(quarter.$id, {
        quarterlyRevenueCollectionTarget: Number(target.quarterlyRevenueCollectionTarget),
      });

      onOpenChange(false);
      onSuccess?.();
      toast.success('Revenue target updated successfully');
    } catch (error) {
      console.error('Error updating revenue target:', error);
      toast.error('Failed to update revenue target');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTarget(prev => ({
      ...prev,
      [name]: value === '' ? '' : Math.max(0, Number(value)),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update Revenue Targets</DialogTitle>
            <DialogDescription>
              Set your quarterly revenue target for <span className="uppercase">{quarter?.quarterId}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="quarterlyRevenueCollectionTarget">
                Quarterly Revenue Target (PKR)
              </Label>
              <Input
                id="quarterlyRevenueCollectionTarget"
                name="quarterlyRevenueCollectionTarget"
                type="number"
                min="0"
                value={target.quarterlyRevenueCollectionTarget}
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
