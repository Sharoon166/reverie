import { Card } from '@/components/ui/card';
import { Coins } from 'lucide-react';

interface CashOnHandProps {
  amount: number;
}

export default function CashOnHand({ amount }: CashOnHandProps) {
  return (
    <Card className="p-6 border-0 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-green-500 rounded-xl">
          <Coins className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="text-base md:text-xl xl:text-2xl font-light text-gray-900">
            Rs. {amount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">
            Cash on Hand (Current Quarter)
          </div>
        </div>
      </div>
    </Card>
  );
}