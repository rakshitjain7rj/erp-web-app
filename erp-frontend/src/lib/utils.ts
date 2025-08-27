// Accept undefined / null / false gracefully, typical Tailwind helper
export function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export const isOverdue = (expectedArrival: string): boolean => {
  const expectedDate = new Date(expectedArrival);
  const today = new Date();
  return expectedDate < today;
};
