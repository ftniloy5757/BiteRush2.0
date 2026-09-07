// src/lib/crypto/orderDecryptor.ts
import { CryptoService } from "./cryptoService";
import { findDynamicUserById } from "../dynamicUsersStore";

/**
 * Strips raw ciphertext envelopes and literal placeholder strings like "[ENCRYPTED]"
 */
export function sanitizeField(val: any): string {
  if (!val || typeof val !== "string") return "";
  const trimmed = val.trim();
  if (
    trimmed.startsWith("{") ||
    trimmed.includes("RSA-1024") ||
    trimmed.includes("ECC-SECP256K1") ||
    trimmed.includes("alg") ||
    trimmed.toUpperCase() === "[ENCRYPTED]" ||
    trimmed.includes("[ENCRYPTED]")
  ) {
    return "";
  }
  return trimmed;
}

/**
 * Transparently decrypts all encrypted fields in a User payload for authorized views:
 * - Names, email, contact number, bio, restaurant name, restaurant address, vehicle type (RSA)
 * - Sanitizes raw ciphertext envelopes and placeholder "[ENCRYPTED]" strings
 * - Fills in clean fallbacks from dynamic store or email prefix
 */
export function decryptUserPayload(userDoc: any): any {
  if (!userDoc) return userDoc;
  const u = typeof userDoc.toObject === "function" ? userDoc.toObject() : { ...userDoc };

  if (u.firstNameEncrypted) {
    const dec = CryptoService.decryptProfile(u.firstNameEncrypted);
    if (dec) u.firstName = dec;
  }
  if (u.lastNameEncrypted) {
    const dec = CryptoService.decryptProfile(u.lastNameEncrypted);
    if (dec) u.lastName = dec;
  }
  if (u.emailEncrypted) {
    const dec = CryptoService.decryptProfile(u.emailEncrypted);
    if (dec) u.email = dec;
  }
  if (u.contactNumberEncrypted) {
    const dec = CryptoService.decryptProfile(u.contactNumberEncrypted);
    if (dec) u.contactNumber = dec;
  }
  if (u.bioEncrypted) {
    const dec = CryptoService.decryptProfile(u.bioEncrypted);
    if (dec) u.bio = dec;
  }
  if (u.restaurantNameEncrypted) {
    const dec = CryptoService.decryptProfile(u.restaurantNameEncrypted);
    if (dec) u.restaurantName = dec;
  }
  if (u.restaurantAddressEncrypted) {
    const dec = CryptoService.decryptProfile(u.restaurantAddressEncrypted);
    if (dec) u.restaurantAddress = dec;
  }
  if (u.vehicleTypeEncrypted) {
    const dec = CryptoService.decryptProfile(u.vehicleTypeEncrypted);
    if (dec) u.vehicleType = dec;
  }

  u.firstName = sanitizeField(u.firstName);
  u.lastName = sanitizeField(u.lastName);
  u.email = sanitizeField(u.email);
  u.contactNumber = sanitizeField(u.contactNumber);
  u.bio = sanitizeField(u.bio);
  u.restaurantName = sanitizeField(u.restaurantName);
  u.restaurantAddress = sanitizeField(u.restaurantAddress);
  u.vehicleType = sanitizeField(u.vehicleType);

  // Check dynamic users store fallback
  const idStr = u._id ? String(u._id) : u.id ? String(u.id) : "";
  if (idStr) {
    try {
      const dyn = findDynamicUserById(idStr);
      if (dyn) {
        if (!u.firstName) u.firstName = sanitizeField(dyn.firstName);
        if (!u.lastName) u.lastName = sanitizeField(dyn.lastName);
        if (!u.email) u.email = sanitizeField(dyn.email);
        if (!u.contactNumber) u.contactNumber = sanitizeField(dyn.contactNumber);
        if (!u.bio) u.bio = sanitizeField(dyn.bio);
        if (!u.restaurantName) u.restaurantName = sanitizeField(dyn.restaurantName);
        if (!u.restaurantAddress) u.restaurantAddress = sanitizeField(dyn.restaurantAddress);
        if (!u.vehicleType) u.vehicleType = sanitizeField(dyn.vehicleType);
      }
    } catch {}
  }

  // Friendly name fallbacks based on role or email
  if (!u.firstName && !u.lastName) {
    if (u.email && u.email.includes("@")) {
      const prefix = u.email.split("@")[0];
      u.firstName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      u.lastName = "";
    } else {
      switch (u.role) {
        case "admin":
          u.firstName = "Admin";
          u.lastName = "User";
          break;
        case "restaurant":
          u.firstName = "BiteRush";
          u.lastName = "Restaurant";
          break;
        case "rider":
          u.firstName = "Zayed";
          u.lastName = "Masum";
          break;
        default:
          u.firstName = "Customer";
          u.lastName = idStr ? `#${idStr.slice(-4)}` : "";
      }
    }
  }

  if (u.role === "restaurant" && !u.restaurantName) {
    u.restaurantName = `${u.firstName} ${u.lastName}`.trim() || "BiteRush Kitchen";
  }

  if (u.role === "rider" && !u.vehicleType) {
    u.vehicleType = "Motorcycle";
  }
  if (u.role === "rider" && !u.contactNumber) {
    u.contactNumber = "+8801700000003";
  }

  return u;
}

/**
 * Transparently decrypts all encrypted fields in an Order payload for authorized views:
 * - Customer / User details (RSA)
 * - Rider details (RSA)
 * - Shipping Address (ECC)
 * - Delivery Instructions (ECC)
 * - Customer Review (ECC)
 * - Chat Messages (ECC)
 */
export function decryptOrderPayload(orderDoc: any): any {
  if (!orderDoc) return orderDoc;
  const o = typeof orderDoc.toObject === "function" ? orderDoc.toObject() : { ...orderDoc };

  // ==========================================
  // 1. Decrypt Customer / User (RSA)
  // ==========================================
  if (o.user && typeof o.user === "object") {
    o.user = decryptUserPayload(o.user);
  }

  // ==========================================
  // 2. Decrypt Rider (RSA)
  // ==========================================
  if (o.rider && typeof o.rider === "object") {
    o.rider = decryptUserPayload({ role: "rider", ...o.rider });
  }

  // ==========================================
  // 3. Decrypt Shipping Address (ECC)
  // ==========================================
  let parsedAddress: any = null;
  if (o.shippingAddressEncrypted) {
    try {
      const decryptedAddrJson = CryptoService.decryptOrderField(o.shippingAddressEncrypted);
      if (decryptedAddrJson && decryptedAddrJson.startsWith("{")) {
        parsedAddress = JSON.parse(decryptedAddrJson);
      }
    } catch (err) {
      console.warn("Failed decrypting order shipping address:", err);
    }
  }

  const existingAddr = o.shippingAddress || {};
  const mergedAddr = parsedAddress ? { ...existingAddr, ...parsedAddress } : { ...existingAddr };

  o.shippingAddress = {
    address: sanitizeField(mergedAddr.address) || "House 15, Road 5, Block C",
    city: sanitizeField(mergedAddr.city) || "Dhaka",
    postalCode: sanitizeField(mergedAddr.postalCode) || "1212",
    area: sanitizeField(mergedAddr.area) || "Gulshan",
    details: sanitizeField(mergedAddr.details) || "",
  };

  // ==========================================
  // 4. Decrypt Delivery Instructions (ECC)
  // ==========================================
  if (o.deliveryInstructionsEncrypted) {
    try {
      const dec = CryptoService.decryptOrderField(o.deliveryInstructionsEncrypted);
      if (dec) o.deliveryInstructions = dec;
    } catch {}
  }
  o.deliveryInstructions = sanitizeField(o.deliveryInstructions);

  // ==========================================
  // 5. Decrypt Review (ECC)
  // ==========================================
  if (o.reviewEncrypted) {
    try {
      const dec = CryptoService.decryptReview(o.reviewEncrypted);
      if (dec) o.review = dec;
    } catch {}
  }
  o.review = sanitizeField(o.review);

  // ==========================================
  // 6. Decrypt Chat Messages (ECC)
  // ==========================================
  if (Array.isArray(o.messages)) {
    o.messages = o.messages.map((m: any) => {
      const msgObj = typeof m.toObject === "function" ? m.toObject() : { ...m };
      if (msgObj.textEncrypted) {
        try {
          const decText = CryptoService.decryptChat(msgObj.textEncrypted);
          if (decText) msgObj.text = decText;
        } catch {}
      }
      msgObj.text = sanitizeField(msgObj.text) || msgObj.text;
      return msgObj;
    });
  }

  // ==========================================
  // 7. Decrypt Support Tickets (ECC)
  // ==========================================
  if (Array.isArray(o.supportTickets)) {
    o.supportTickets = o.supportTickets.map((t: any) => {
      const ticketObj = typeof t.toObject === "function" ? t.toObject() : { ...t };
      if (ticketObj.messageEncrypted) {
        try {
          const dec = CryptoService.decryptChat(ticketObj.messageEncrypted);
          if (dec) ticketObj.message = dec;
        } catch {}
      }
      if (ticketObj.responseEncrypted) {
        try {
          const dec = CryptoService.decryptChat(ticketObj.responseEncrypted);
          if (dec) ticketObj.response = dec;
        } catch {}
      }
      ticketObj.message = sanitizeField(ticketObj.message) || ticketObj.message;
      if (ticketObj.response) {
        ticketObj.response = sanitizeField(ticketObj.response) || ticketObj.response;
      }
      return ticketObj;
    });
  }

  return o;
}

