export type Role = "Admin" | "Manager" | "Operator";

export type User = {
  name: string;
  email: string;
  avatarUrl?: string;
  role: Role;
};
