export function addCalendarDays(date: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(days)) {
    throw new Error("A valid date and whole number of days are required.");
  }
  const [year, month, day] = date.split("-").map(Number);
  const original = new Date(Date.UTC(year, month - 1, day));
  if (original.toISOString().slice(0, 10) !== date) throw new Error("A valid date and whole number of days are required.");
  const value = new Date(year, month - 1, day + days);
  if (value.getFullYear() !== year || Number.isNaN(value.getTime())) {
    throw new Error("The follow-up date is outside the supported range.");
  }
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function daysBetweenDates(from: string, to: string): number {
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Both values must be valid calendar dates.");
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (parsed.toISOString().slice(0, 10) !== value) throw new Error("Both values must be valid calendar dates.");
    return parsed.getTime();
  };
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}
