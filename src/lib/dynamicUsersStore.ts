// src/lib/dynamicUsersStore.ts
import { DEMO_USERS } from "./demoData";

export interface StoredUser {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber?: string;
  role: string;
  passwordHash: string;
  restaurantName?: string;
  restaurantAddress?: string;
  vehicleType?: string;
  firstNameEncrypted?: string;
  lastNameEncrypted?: string;
  emailEncrypted?: string;
  contactNumberEncrypted?: string;
  restaurantNameEncrypted?: string;
  restaurantAddressEncrypted?: string;
  vehicleTypeEncrypted?: string;
  emailLookupHmac?: string;
  contactNumberLookupHmac?: string;
  emailOtp?: string;
  emailOtpExpiresAt?: Date | string;
  twoFactorOtp?: string;
  twoFactorOtpExpiresAt?: Date | string;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  isTwoFactorVerified: boolean;
  savedAddresses?: any[];
  bio?: string;
  integrityMac?: string;
  createdAt?: string;
  updatedAt?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var dynamicRegisteredUsers: StoredUser[] | undefined;
}

if (!global.dynamicRegisteredUsers) {
  global.dynamicRegisteredUsers = [];
}

export const getDynamicUsers = (): StoredUser[] => {
  if (!global.dynamicRegisteredUsers) {
    global.dynamicRegisteredUsers = [];
  }
  return global.dynamicRegisteredUsers;
};

export const findDynamicUserByEmail = (email: string): StoredUser | null => {
  const users = getDynamicUsers();
  const normalized = email.toLowerCase().trim();
  return users.find((u) => u.email.toLowerCase().trim() === normalized) || null;
};

export const findDynamicUserById = (id: string): StoredUser | null => {
  const users = getDynamicUsers();
  return users.find((u) => u._id === id || u.id === id) || null;
};

export const addDynamicUser = (userData: Partial<StoredUser>): StoredUser => {
  const users = getDynamicUsers();
  const hexTimestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const randomHex = Math.floor(Math.random() * 0xffffffffffff).toString(16).padStart(16, "0");
  const generatedId = (hexTimestamp + randomHex).toLowerCase();

  const existingIndex = users.findIndex(
    (u) =>
      (userData.email && u.email.toLowerCase().trim() === userData.email.toLowerCase().trim()) ||
      (userData._id && u._id === userData._id)
  );

  const newUser: StoredUser = {
    _id: userData._id || generatedId,
    id: userData.id || userData._id || generatedId,
    firstName: userData.firstName || "Customer",
    lastName: userData.lastName || "",
    email: (userData.email || "").toLowerCase().trim(),
    contactNumber: userData.contactNumber || "+8801700000000",
    role: userData.role || "customer",
    passwordHash: userData.passwordHash || "",
    restaurantName: userData.restaurantName,
    restaurantAddress: userData.restaurantAddress,
    vehicleType: userData.vehicleType,
    firstNameEncrypted: userData.firstNameEncrypted,
    lastNameEncrypted: userData.lastNameEncrypted,
    emailEncrypted: userData.emailEncrypted,
    contactNumberEncrypted: userData.contactNumberEncrypted,
    restaurantNameEncrypted: userData.restaurantNameEncrypted,
    restaurantAddressEncrypted: userData.restaurantAddressEncrypted,
    vehicleTypeEncrypted: userData.vehicleTypeEncrypted,
    emailLookupHmac: userData.emailLookupHmac,
    contactNumberLookupHmac: userData.contactNumberLookupHmac,
    emailOtp: userData.emailOtp,
    emailOtpExpiresAt: userData.emailOtpExpiresAt,
    twoFactorOtp: userData.twoFactorOtp,
    twoFactorOtpExpiresAt: userData.twoFactorOtpExpiresAt,
    isEmailVerified: userData.isEmailVerified || false,
    isTwoFactorEnabled: userData.isTwoFactorEnabled !== false,
    isTwoFactorVerified: userData.isTwoFactorVerified || false,
    savedAddresses: userData.savedAddresses || [],
    integrityMac: userData.integrityMac,
    createdAt: userData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...newUser };
    return users[existingIndex];
  }

  users.push(newUser);
  return newUser;
};

export const updateDynamicUser = (id: string, updates: Partial<StoredUser>): StoredUser | null => {
  const users = getDynamicUsers();
  const idx = users.findIndex((u) => u._id === id || u.id === id || (updates.email && u.email === updates.email));
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
    return users[idx];
  }
  return null;
};
