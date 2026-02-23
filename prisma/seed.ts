import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // TeamAdmin yaratish (faqat 1 ta)
    const hashedPassword = await bcrypt.hash("admin2026", 10);

    const teamAdmin = await prisma.user.upsert({
        where: { login: "teamadmin" },
        update: {},
        create: {
            login: "teamadmin",
            password: hashedPassword,
            name: "TeamAdmin",
            role: Role.TEAM_ADMIN,
            isActive: true,
        },
    });

    // Birinchi sayt: pimedia.uz
    const pimediaSite = await prisma.site.upsert({
        where: { domain: "pimedia.uz" },
        update: {},
        create: {
            domain: "pimedia.uz",
            name: "Pi MEDIA — SMM Agentlik",
            isActive: true,
        },
    });

    // TeamAdmin ni saytga ulash
    await prisma.userSite.upsert({
        where: {
            userId_siteId: {
                userId: teamAdmin.id,
                siteId: pimediaSite.id,
            },
        },
        update: {},
        create: {
            userId: teamAdmin.id,
            siteId: pimediaSite.id,
        },
    });

    console.log("✅ Seed muvaffaqiyatli!");
    console.log(`   TeamAdmin login: teamadmin`);
    console.log(`   TeamAdmin parol: admin2026`);
    console.log(`   Sayt: pimedia.uz`);
}

main()
    .catch((e) => {
        console.error("❌ Seed xatosi:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
