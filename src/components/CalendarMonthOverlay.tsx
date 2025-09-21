import React from "react";
import { useCalendarMonth, useCalendarYear } from "@/components/ui/kibo-ui/calendar";
import type { Feature } from "@/components/ui/kibo-ui/calendar";

type Props = {
  features: Feature[];
  onDayClick: (date: Date, events: Feature[]) => void;
};

const CalendarMonthOverlay: React.FC<Props> = ({ features, onDayClick }) => {
  const [month] = useCalendarMonth();
  const [year] = useCalendarYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: React.ReactElement[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const events = features.filter(f =>
      f.startAt.toDateString() === date.toDateString()
    );
    days.push(
      <div
        key={d}
        className="pointer-events-auto cursor-pointer"
        onClick={() => {
          if (events.length > 0) onDayClick(date, events);
        }}
      />
    );
  }
  return (
    <div className="absolute inset-0 grid grid-cols-7 pointer-events-none" style={{ height: 340 }}>
      {days}
    </div>
  );
};

export default CalendarMonthOverlay;
