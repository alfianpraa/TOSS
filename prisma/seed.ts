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
    where: { title: "Company Profile Website - PT Maju Jaya" },
  });

  if (!existingCard) {
    await prisma.card.create({
      data: {
        title: "Company Profile Website - PT Maju Jaya",
        clientName: "PT Maju Jaya",
        clientContact: "budi@majujaya.com / +62 812-3456-7890",
        description: "Lead from the website contact form, needs a 5-page company profile.",
        status: "NEW_LEAD",
        createdById: sales.id,
        activities: {
          create: {
            authorId: sales.id,
            type: "SALES_UPDATE",
            content: "Lead came in from the website contact form, already contacted via WhatsApp.",
          },
        },
      },
    });
  }

  console.log("Seed complete. Demo accounts (password: %s):", DEMO_PASSWORD);
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
