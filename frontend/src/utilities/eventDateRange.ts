const isSameCalendarDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const isExclusiveMidnightEnd = (startDate: Date, endDate: Date) =>
  endDate.getTime() > startDate.getTime() &&
  endDate.getHours() === 0 &&
  endDate.getMinutes() === 0 &&
  endDate.getSeconds() === 0 &&
  endDate.getMilliseconds() === 0;

const getDisplayEndDate = (startDate: Date, endDate: Date) =>
  isExclusiveMidnightEnd(startDate, endDate)
    ? new Date(endDate.getTime() - 60_000)
    : endDate;

export const formatEventDateRange = (startDate: Date, endDate: Date) => {
  const displayEndDate = getDisplayEndDate(startDate, endDate);
  const renderEndTimeOnly = isSameCalendarDay(startDate, displayEndDate);

  return `${startDate.formatDateTime()} - ${
    renderEndTimeOnly ? displayEndDate.formatTime() : displayEndDate.formatDateTime()
  }`;
};
