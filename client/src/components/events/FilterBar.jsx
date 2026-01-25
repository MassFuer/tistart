import React from 'react';

/**
 * FilterBar component renders category dropdown and date range inputs.
 * Props:
 *  - category: current selected category string
 *  - startDate: current start date (ISO string or empty)
 *  - endDate: current end date (ISO string or empty)
 *  - onCategoryChange: (e) => void handler for category select
 *  - onStartDateChange: (e) => void handler for start date input
 *  - onEndDateChange: (e) => void handler for end date input
 */
const FilterBar = ({
  category,
  startDate,
  endDate,
  onCategoryChange,
  onStartDateChange,
  onEndDateChange,
}) => {
  const categories = ["exhibition", "concert", "workshop", "meetup", "other"];

  return (
    <div className="events-filter-bar">
      <select name="category" value={category} onChange={onCategoryChange} className="filter-select">
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </option>
        ))}
      </select>
      <input
        type="date"
        name="startDate"
        value={startDate?.slice(0, 10) || ""}
        onChange={onStartDateChange}
        placeholder="Start date"
      />
      <input
        type="date"
        name="endDate"
        value={endDate?.slice(0, 10) || ""}
        onChange={onEndDateChange}
        placeholder="End date"
      />
    </div>
  );
};

export default FilterBar;
