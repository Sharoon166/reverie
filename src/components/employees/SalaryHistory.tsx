"use client";

import { Card } from "@/components/ui/card";
import type { SalaryPayment } from "@/types";
import { Coins } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { formatDate } from "@/lib/date-utils";
import { formatPakistaniCurrency } from "@/lib/utils";

interface SalaryHistoryProps {
  salaryPayments: SalaryPayment[] | undefined;
}

export default function SalaryHistory({ salaryPayments }: SalaryHistoryProps) {
  if (!salaryPayments) return null;
  return (
    <Card className="p-8 border-0 shadow-sm bg-white">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-yellow-400 rounded-xl">
          <Coins className="h-6 w-6 text-gray-900" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Salary Payments
          </h3>
          <p className="text-sm text-gray-600">
            Monthly payments including bonuses
          </p>
        </div>
      </div>
      <ScrollArea className="max-h-40">

        <div className="space-y-3">
          {salaryPayments.length > 0 ? (
            salaryPayments
              ?.sort((a, b) => b.month.localeCompare(a.month)) // newest first
              .map((p, idx) => (
                <div
                  key={String((p as SalaryPayment)?.$id ?? (p as SalaryPayment)?.id ?? `${p.month}-${p.paidDate ?? ''}-${p.netAmount ?? ''}`) || `salary-${idx}`}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                >
                  <div className="">
                    <div className="text-gray-900 font-medium">{p.month}</div>
                    <div className="font-medium text-xs text-muted-foreground">Paid on: {formatDate(p.paidDate!)}</div>
                  </div>
                  <div className="text-gray-700">
                    <div className="text-sm text-gray-600">
                      Net: {formatPakistaniCurrency(p.netAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">

                      {p.amount.toLocaleString()}
                      {p.bonus?.amount ? (
                        <span>
                          {" "}
                          + Bonus: {p.bonus.amount.toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-sm text-gray-500">
              No salary payments recorded.
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
