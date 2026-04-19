const formatLocalDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const parseDateString = (dateString) => {
    const [year, month, day] = String(dateString).split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
};

const isPastDate = (dateString, now = new Date()) => dateString < formatLocalDate(now);

const isPastSlot = (dateString, hour, now = new Date()) => {
    const slotDate = parseDateString(dateString);
    slotDate.setHours(Number(hour), 0, 0, 0);
    return slotDate <= now;
};

const filterPastSlots = (dateString, slots, now = new Date()) =>
    slots.filter((hour) => !isPastSlot(dateString, hour, now));

module.exports = {
    filterPastSlots,
    formatLocalDate,
    isPastDate,
    isPastSlot,
};
