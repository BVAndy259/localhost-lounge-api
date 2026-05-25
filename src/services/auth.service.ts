import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { env } from '../config/env';
import HttpError from '../utils/httpError';

export const AuthService = {
  async registerUser(name: string, email: string, password: string, role: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) throw new HttpError(409, 'El email ya está registrado', 'EMAIL_EXISTS');

    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role: role || 'RECEPCIONISTA',
      },
    });

    const { password_hash: __newUser_password_hash, ...userWithoutPassword } = newUser;
    void __newUser_password_hash;
    return userWithoutPassword;
  },

  async loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) throw new HttpError(401, 'Credenciales inválidas', 'INVALID_CREDENTIALS');

    if (!user.active)
      throw new HttpError(
        403,
        'Cuenta suspendida. Ponte en contacto con el administrador.',
        'ACCOUNT_SUSPENDED'
      );

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) throw new HttpError(401, 'Credenciales inválidas', 'INVALID_CREDENTIALS');

    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: '8h',
    });

    const { password_hash: __user_password_hash, ...userData } = user;
    void __user_password_hash;
    return {
      user: userData,
      token,
    };
  },
};
