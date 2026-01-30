import React from "react";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EmptyState = ({
  title = "No items found",
  description = "We couldn't find what you were looking for.",
  actionLabel,
  actionLink,
  icon: Icon = FolderOpen,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
        <Icon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
        {description}
      </p>
      {actionLabel && actionLink && (
        <Button onClick={() => navigate(actionLink)}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
