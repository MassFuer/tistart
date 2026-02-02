import React from "react";
import { Layers, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Reusable UI controls for table grouping.
 *
 * @param {string|null} groupBy - Current grouping field (pass null to clear grouping)
 * @param {Function} setGroupBy - Setter for grouping field
 * @param {Array} options - Array of { label, value } for grouping
 * @param {Function} onExpandAll - Global expand handler
 * @param {Function} onCollapseAll - Global collapse handler
 * @param {string} className - Optional styling
 */
const TableGroupingControls = ({
  groupBy,
  setGroupBy,
  options = [],
  onExpandAll,
  onCollapseAll,
  className = "",
}) => {
  const currentLabel =
    options.find((o) => o.value === groupBy)?.label || "None";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-9 rounded-r-none border-r-0"
            >
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-medium">
                Group By:
              </span>
              <span className="text-xs">{currentLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {options.map((opt) => (
              <DropdownMenuItem
                key={opt.label}
                onClick={() => setGroupBy(opt.value)}
                className={groupBy === opt.value ? "bg-muted font-bold" : ""}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {groupBy && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setGroupBy(null)}
            className="h-9 w-9 rounded-l-none border-l-0 hover:text-destructive transition-colors"
            title="Clear Grouping"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {groupBy && (
        <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/20 h-9">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpandAll}
            className="h-7 px-2 gap-1.5 text-xs"
            title="Expand All"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden lg:inline font-normal">Expand All</span>
          </Button>
          <div className="w-[1px] h-4 bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onCollapseAll}
            className="h-7 px-2 gap-1.5 text-xs"
            title="Collapse All"
          >
            <Minimize2 className="h-3.5 w-3.5" />
            <span className="hidden lg:inline font-normal">Collapse All</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default TableGroupingControls;
