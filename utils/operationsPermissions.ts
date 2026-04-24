import { Role, User } from '../types';

export const OPERATIONS_MANAGED_ROLES: Role[] = [
  Role.TECHNICIAN,
  Role.ADMINISTRATIVE,
  Role.MARKETING,
  Role.SALES,
  Role.CLEANING,
];

export const isOperationsManager = (user: User | null | undefined): boolean =>
  !!user && user.role === Role.OPERATIONS;

export const canOperationsManageUser = (
  manager: User | null | undefined,
  target: User
): boolean => {
  if (!isOperationsManager(manager)) return false;
  if (!OPERATIONS_MANAGED_ROLES.includes(target.role)) return false;

  // "A su cargo" queda aislado por empresa.
  if (!manager?.company || !target.company) return false;
  return manager.company === target.company;
};

export const canManageUserFromPanel = (
  manager: User | null | undefined,
  target: User
): boolean => {
  if (!manager) return false;
  if (manager.role === Role.ADMIN) return true;
  return canOperationsManageUser(manager, target);
};

