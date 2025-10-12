// backend/scripts/create-admin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin(email, password) {
    if (!email || !password) {
        console.error('ERRO: Por favor, forneça um email e uma senha.');
        process.exit(1);
    }

    try {
        console.log(`Verificando se o usuário ${email} já existe...`);
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            console.error(`ERRO: O usuário com o email "${email}" já existe.`);
            process.exit(1);
        }

        console.log('Criando hash da senha...');
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Criando usuário administrador no banco de dados...');
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'ADMIN',
            },
        });

        console.log('✅ Sucesso! Usuário administrador criado:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);

    } catch (error) {
        console.error('❌ Falha ao criar o administrador:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Pega os argumentos da linha de comando
const email = process.argv[2];
const password = process.argv[3];

createAdmin(email, password);
