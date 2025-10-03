'use client';

import { format, differenceInDays } from 'date-fns';
import { useState } from 'react';
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
import ConfirmationDialog from '@/components/ui/confirmation-dialog';

interface CloseQuarterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  endDate: Date;
  isLoading?: boolean;
  withdrawalAmount: string;
  setWithdrawalAmount: React.Dispatch<React.SetStateAction<string>>;
}

export function CloseQuarterDialog({
  open,
  onOpenChange,
  onConfirm,
  endDate,
  isLoading = false,
  withdrawalAmount,
  setWithdrawalAmount,
}: CloseQuarterDialogProps) {
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  
  const today = new Date();
  const daysRemaining = differenceInDays(endDate, today);
  const isEarly = daysRemaining > 0;

  const handleWithdrawalSubmit = () => {
    setShowWithdrawalDialog(false);
    setShowCloseConfirm(true);
  };

  const handleCloseConfirm = () => {
    setShowCloseConfirm(false);
    onConfirm();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShowWithdrawalDialog(false);
      setShowCloseConfirm(false);
    }
    onOpenChange(open);
  };

  const title = isEarly 
    ? `Close Quarter Early?` 
    : 'Close Quarter';
    
  const description = isEarly 
    ? `There are still ${daysRemaining} days remaining in this quarter (ends ${format(endDate, 'MMM d, yyyy')}). Are you sure you want to close it?`
    : `This will close the quarter ending ${format(endDate, 'MMM d, yyyy')}. This action cannot be undone.`;

  return (
    <>
      {/* Withdrawal Dialog */}
      <Dialog open={open && !showCloseConfirm} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Enter the amount you'd like to withdraw before closing the quarter.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="withdrawal-amount" className="text-right">
                Amount
              </Label>
              <Input
                id="withdrawal-amount"
                type="number"
                className="col-span-3"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleWithdrawalSubmit}
              disabled={isLoading || !withdrawalAmount}
            >
              {isLoading ? 'Processing...' : 'Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Quarter Confirmation */}
      <ConfirmationDialog
        open={showCloseConfirm}
        onOpenChange={setShowCloseConfirm}
        title={title}
        description={description}
        confirmText="Confirm Close Quarter"
        cancelText="Back"
        variant="destructive"
        onConfirm={handleCloseConfirm}
        isLoading={isLoading}
      />
    </>
  );
}
