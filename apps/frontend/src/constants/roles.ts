export const USER_ROLES = {
  ADMIN: 'ADMIN',
  COLLEGE_ADMIN: 'COLLEGE_ADMIN',
  CANTEEN_STAFF: 'CANTEEN_STAFF',
  STUDENT: 'STUDENT',
} as const;

export type UserRoleType = typeof USER_ROLES[keyof typeof USER_ROLES];
