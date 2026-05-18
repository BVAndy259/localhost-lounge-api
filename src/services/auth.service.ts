import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { env } from "../config/env";

export const AuthService = {
  async registerUser(
    name: string,
    email: string,
    password: string,
    role: string,
  ) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) throw new Error("El email ya está registrado");

    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role: role || "RECEPCIONISTA",
      },
    });

    const { password_hash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  async loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) throw new Error("Credenciales inválidas");

    if (!user.active)
      throw new Error(
        "Cuenta suspendida. Ponte en contacto con el administrador.",
      );

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) throw new Error("Credenciales inválidas");

    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: "8h",
    });

    const { password_hash: _, ...userData } = user;
    return {
      user: userData,
      token,
    };
  },
};
