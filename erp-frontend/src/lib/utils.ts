export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export const isOverdue = (expectedArrival: string): boolean => {
  const expectedDate = new Date(expectedArrival);
  const today = new Date();
  return expectedDate < today;
};
