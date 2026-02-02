import { useState, useEffect, useMemo } from "react";

/**
 * Hook to manage complex table grouping with collapsible sections.
 *
 * @param {Array} data - The flat array of items to group
 * @param {string|null} initialGroupBy - Initial grouping field path
 * @returns {Object} Grouping state and helper functions
 */
export const useTableGrouping = (data = [], initialGroupBy = null) => {
  const [groupBy, setGroupBy] = useState(initialGroupBy);
  const [expandedGroups, setExpandedGroups] = useState({});

  // Reset expanded groups when grouping criteria changes
  useEffect(() => {
    setExpandedGroups({});
  }, [groupBy]);

  // Utility to get nested values (e.g., 'artistInfo.companyName')
  const getGroupValue = (item, path) => {
    if (!path) return null;
    const value = path.split(".").reduce((obj, key) => obj?.[key], item);

    // Special case for boolean or status-like fields
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (value === null || value === undefined) return "N/A";

    return value;
  };

  // Memoized grouped data
  const groupedData = useMemo(() => {
    if (!groupBy || !data.length) return null;

    return data.reduce((acc, item) => {
      const val = getGroupValue(item, groupBy);
      if (!acc[val]) acc[val] = [];
      acc[val].push(item);
      return acc;
    }, {});
  }, [data, groupBy]);

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const expandAll = () => {
    if (!groupedData) return;
    const allExpanded = Object.keys(groupedData).reduce((acc, name) => {
      acc[name] = true;
      return acc;
    }, {});
    setExpandedGroups(allExpanded);
  };

  const collapseAll = () => {
    setExpandedGroups({});
  };

  return {
    groupBy,
    setGroupBy,
    groupedData,
    expandedGroups,
    toggleGroup,
    expandAll,
    collapseAll,
  };
};
