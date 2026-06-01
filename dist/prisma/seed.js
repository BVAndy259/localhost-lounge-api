"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../src/config/prisma"));
const env_1 = require("../src/config/env");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function main() {
    console.log('Iniciando semilla...');
    const adminEmail = env_1.env.ADMIN_EMAIL;
    const adminPassword = env_1.env.ADMIN_PASSWORD;
    const adminName = env_1.env.ADMIN_NAME;
    const existingAdmin = await prisma_1.default.user.findUnique({
        where: { email: adminEmail },
    });
    if (!existingAdmin) {
        const salt = await bcryptjs_1.default.genSalt(12);
        const hashedPassword = await bcryptjs_1.default.hash(adminPassword, salt);
        await prisma_1.default.user.create({
            data: {
                name: adminName,
                email: adminEmail,
                password_hash: hashedPassword,
                role: 'ADMIN',
            },
        });
        console.log('Usuario Admin creado correctamente');
    }
    else {
        console.log('Usuario Admin ya existente, omitiendo semilla...');
    }
}
main()
    .catch((e) => {
    console.error('[SEED ERROR]', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.default.$disconnect();
});
