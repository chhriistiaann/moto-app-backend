import crypto from "crypto";

const algorithm = "aes-128-cbc";
const key = Buffer.from(process.env.SECRET_KEY || "1234567890123456");
const iv = Buffer.from(process.env.IV || "1234567890123456"); // Debe ser de 16 bytes

export const encrypt = (text: string): string => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
};

export const decrypt = (encryptedText: string): string => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
