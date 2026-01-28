import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

/**
 * Mobile filter sheet — renders a trigger button and a slide-out panel.
 * Place the trigger in the header and pass filter content as children.
 */
export const FilterSheet = ({
  children,
  title = "Filters",
  description = "Refine your search",
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Filter className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">{title}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="py-4">{children}</div>
        <SheetFooter>
          <SheetClose asChild>
            <Button className="w-full">Show Results</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

/**
 * Desktop filter sidebar — sticky aside panel.
 * Place in the page layout next to the main content area.
 */
export const FilterAside = ({ children, show = true }) => {
  if (!show) return null;
  return (
    <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24 self-start p-6 border rounded-xl bg-card/50 shadow-sm backdrop-blur-sm">
      {children}
    </aside>
  );
};