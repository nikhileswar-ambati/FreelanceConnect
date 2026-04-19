export const formatLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseDateString = (dateString) => {
  const [year, month, day] = String(dateString).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

export const isTodayDateString = (dateString, now = new Date()) =>
  dateString === formatLocalDate(now);

export const isFutureSlot = (dateString, hour, now = new Date()) => {
  const slotDate = parseDateString(dateString);
  slotDate.setHours(Number(hour), 0, 0, 0);
  return slotDate > now;
};

export const filterPastHours = (hours, dateString, now = new Date()) =>
  hours.filter((hour) => isFutureSlot(dateString, hour, now));

export const formatDisplayDate = (value) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDisplayTime = (value) => {
  if (value === undefined || value === null || value === "") return "-";

  if (typeof value === "number") {
    const date = new Date();
    date.setHours(value, 0, 0, 0);
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (typeof value === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    const [hours, minutes] = value.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes || 0, 0, 0);
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatDisplayDateTime = (value) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatHourRange = (hour) => {
  const start = formatDisplayTime(hour);
  const end = formatDisplayTime((Number(hour) + 1) % 24);
  return `${start} - ${end}`;
};

export const formatRequestedSlots = (hours = []) => {
  if (!Array.isArray(hours) || hours.length === 0) return "-";
  return [...hours]
    .sort((a, b) => Number(a) - Number(b))
    .map((hour) => formatHourRange(Number(hour)))
    .join(", ");
};
