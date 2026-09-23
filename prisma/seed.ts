import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

const users: { name: string; email: string; role: Role }[] = [
  { name: "Admin", email: "admin@demo.com", role: "ADMIN" },
  { name: "Sasa", email: "sales@demo.com", role: "SALES" },
  { name: "Deni", email: "developer@demo.com", role: "DEVELOPER" },
  { name: "Mira", email: "marketing@demo.com", role: "MARKETING" },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const createdUsers = await Promise.all(
    users.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          role: u.role,
          employeeId: null,
          phone: null,
          avatarUrl: null,
        },
        create: { ...u, passwordHash },
      })
    )
  );

  const sales = createdUsers.find((u) => u.role === "SALES")!;

  const existingCard = await prisma.card.findFirst({
    where: { title: "Website Company Profile - PT Maju Jaya" },
  });

  if (!existingCard) {
    await prisma.card.create({
      data: {
        title: "Website Company Profile - PT Maju Jaya",
        clientName: "PT Maju Jaya",
        clientContact: "budi@majujaya.com / 0812-3456-7890",
        description: "Lead dari form kontak website, butuh company profile 5 halaman.",
        status: "NEW_LEAD",
        createdById: sales.id,
        activities: {
          create: {
            authorId: sales.id,
            type: "SALES_UPDATE",
            content: "Lead masuk dari form kontak website, sudah dihubungi via WhatsApp.",
          },
        },
      },
    });
  }

  console.log("Seed selesai. Akun demo (password: %s):", DEMO_PASSWORD);
  createdUsers.forEach((u) => console.log(`- ${u.role}: ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
