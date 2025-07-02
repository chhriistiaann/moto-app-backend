// middlewares/encryptionMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { decrypt, encrypt } from '../services/encrypt_service';

// 🔐 Middleware para cifrar todas las respuestas
export const encryptResponseMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json;

  res.json = function (data: any) {
    const json = JSON.stringify(data);
    const encrypted = encrypt(json);
    return originalJson.call(this, { encrypted });
  };

  next();
};

// 🔓 Middleware para descifrar los cuerpos entrantes
export const decryptRequestMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body?.encrypted) {
    try {
      const decrypted = decrypt(req.body.encrypted);
      req.body = JSON.parse(decrypted);
    } catch (e) {
      res.status(400).json({ message: 'Invalid encrypted body' });
    }
  }
  next();
};
