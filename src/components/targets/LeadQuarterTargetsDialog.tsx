'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateQuarter } from '@/app/actions/quarters';
import type { Quarter } from '@/types';

interface QuarterTargetsDialogProps {
  open: boolean;
  quarter: Quarter | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LeadQuarterTargetsDialog({
  open,
  quarter,
  onOpenChange,
  onSuccess,
}: QuarterTargetsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [targets, setTargets] = useState({
    proposalsSentTarget: 0,
    meetingsBookedTarget: 0,
  });

  useEffect(() => {
    if (quarter) {
        setTargets({
          proposalsSentTarget: quarter.proposalsSentTarget ?? 0,
          meetingsBookedTarget: quarter.meetingsBookedTarget ?? 0,
        });
      }
    }, [quarter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quarter) return;

    setIsLoading(true);
    try {
      await updateQuarter(quarter.$id, {
        proposalsSentTarget: Number(targets.proposalsSentTarget),
        meetingsBookedTarget: Number(targets.meetingsBookedTarget),
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating targets:', error);
      toast.error('Failed to update targets');
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
            <DialogTitle>Update Quarter Targets</DialogTitle>
            <DialogDescription>
              Set your targets for <span className="uppercase">{quarter?.quarterId}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="griditems-center gap-4">
              <Label htmlFor="proposalsSentTarget" className="text-right">
                Proposals Sent Target
              </Label>
              <Input
                id="proposalsSentTarget"
                name="proposalsSentTarget"
                type="number"
                min="0"
                value={targets.proposalsSentTarget}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="grid  gap-4">
              <Label htmlFor="meetingsBookedTarget">
                Meetings Booked Target
              </Label>
              <Input
                id="meetingsBookedTarget"
                name="meetingsBookedTarget"
                type="number"
                min="0"
                value={targets.meetingsBookedTarget}
                onChange={handleChange}                disabled={isLoading}
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
