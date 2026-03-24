import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  disabled?: (date: Date) => boolean;
}

export function DatePicker({ date, setDate, disabled }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-14 rounded-xl px-4",
            "border-border/50 bg-background hover:bg-secondary/50 hover:border-border",
            "transition-all duration-200 ease-out shadow-sm shadow-black/[0.02]",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-3 h-5 w-5 opacity-70" />
          {date ? (
            <span className="font-body text-base">{format(date, "PPP")}</span>
          ) : (
            <span className="font-body text-base">Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl border-border/50 shadow-xl shadow-black/[0.05]" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && setDate(d)}
          disabled={disabled}
          initialFocus
          className="p-4"
        />
      </PopoverContent>
    </Popover>
  );
}
