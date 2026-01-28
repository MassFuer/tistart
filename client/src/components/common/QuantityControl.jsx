import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

const QuantityControl = ({ value, onChange, min = 1, max, size = "sm", disabled = false }) => {
  const isSmall = size === "sm";

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className={isSmall ? "h-7 w-7" : "h-8 w-8"}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
      >
        <Minus className={isSmall ? "h-3 w-3" : "h-4 w-4"} />
      </Button>
      <span className={`${isSmall ? "w-7 text-sm" : "w-8 text-base"} text-center font-medium`}>
        {value}
      </span>
      <Button
        variant="outline"
        size="icon"
        className={isSmall ? "h-7 w-7" : "h-8 w-8"}
        onClick={() => onChange(value + 1)}
        disabled={disabled || (max !== undefined && value >= max)}
      >
        <Plus className={isSmall ? "h-3 w-3" : "h-4 w-4"} />
      </Button>
    </div>
  );
};

export default QuantityControl;