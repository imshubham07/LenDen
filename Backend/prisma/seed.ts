import bcrypt from "bcryptjs";
import { LoanStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const borrowers = [
  {
    name: "Ramesh Yadav",
    fatherOrHusband: "Suresh Yadav",
    documentNote: "Aadhaar ending 4281",
    village: "Rampur",
    mobile: "9876543210",
    monthlyPercentage: "2.50",
    loans: [
      { amount: "50000", purpose: "Seed and fertilizer", givenDate: "2026-07-05", guarantor: "Mahesh Yadav", status: LoanStatus.ACTIVE },
      { amount: "15000", purpose: "Irrigation repair", givenDate: "2026-08-12", guarantor: "Mahesh Yadav", status: LoanStatus.ACTIVE }
    ],
    payments: [
      { amount: "10000", paymentDate: "2026-08-25", note: "Cash received" },
      { amount: "5000", paymentDate: "2026-09-02", note: "UPI received" }
    ]
  },
  {
    name: "Sunita Devi",
    fatherOrHusband: "Rajesh Kumar",
    documentNote: "Gold ring pledged",
    village: "Basantpur",
    mobile: "9876543211",
    monthlyPercentage: "3.00",
    loans: [
      { amount: "30000", purpose: "Shop inventory", givenDate: "2026-06-18", guarantor: "Anil Kumar", status: LoanStatus.ACTIVE }
    ],
    payments: [
      { amount: "12000", paymentDate: "2026-07-20", note: "First repayment" },
      { amount: "6000", paymentDate: "2026-08-20", note: "Monthly collection" }
    ]
  },
  {
    name: "Imran Ansari",
    fatherOrHusband: "Karim Ansari",
    documentNote: "PAN copy collected",
    village: "Nai Bazar",
    mobile: "9876543212",
    monthlyPercentage: "2.00",
    loans: [
      { amount: "75000", purpose: "Auto-rickshaw repair", givenDate: "2026-05-10", guarantor: "Sameer Ansari", status: LoanStatus.ACTIVE }
    ],
    payments: [
      { amount: "25000", paymentDate: "2026-06-10", note: "Bank transfer" },
      { amount: "15000", paymentDate: "2026-07-10", note: "Cash received" },
      { amount: "10000", paymentDate: "2026-08-10", note: "Cash received" }
    ]
  },
  {
    name: "Meena Kumari",
    fatherOrHusband: "Dinesh Prasad",
    documentNote: "Previous loan closed on time",
    village: "Shivganj",
    mobile: "9876543213",
    monthlyPercentage: "2.25",
    loans: [
      { amount: "20000", purpose: "School fees", givenDate: "2026-04-01", guarantor: null, status: LoanStatus.CLOSED }
    ],
    payments: [
      { amount: "20000", paymentDate: "2026-06-01", note: "Loan closed" }
    ]
  }
];

const notes = [
  "Call Ramesh on Monday for the remaining irrigation repair payment.",
  "Collect signed document copy from Sunita Devi before adding a new loan.",
  "Demo reminder: show borrower search, active filter, payment entry, and notes sync."
];

async function seedAccount(name: string, mobile: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { mobile },
    update: { name, passwordHash },
    create: { name, mobile, passwordHash }
  });

  for (const demoBorrower of borrowers) {
    const borrower = await prisma.borrower.upsert({
      where: {
        userId_mobile: {
          userId: user.id,
          mobile: demoBorrower.mobile
        }
      },
      update: {
        name: demoBorrower.name,
        fatherOrHusband: demoBorrower.fatherOrHusband,
        documentNote: demoBorrower.documentNote,
        village: demoBorrower.village,
        monthlyPercentage: demoBorrower.monthlyPercentage
      },
      create: {
        userId: user.id,
        name: demoBorrower.name,
        fatherOrHusband: demoBorrower.fatherOrHusband,
        documentNote: demoBorrower.documentNote,
        village: demoBorrower.village,
        mobile: demoBorrower.mobile,
        monthlyPercentage: demoBorrower.monthlyPercentage
      }
    });

    for (const loan of demoBorrower.loans) {
      const existing = await prisma.loan.findFirst({
        where: {
          userId: user.id,
          borrowerId: borrower.id,
          amount: loan.amount,
          purpose: loan.purpose,
          givenDate: new Date(loan.givenDate)
        }
      });

      if (!existing) {
        await prisma.loan.create({
          data: {
            userId: user.id,
            borrowerId: borrower.id,
            ...loan,
            givenDate: new Date(loan.givenDate)
          }
        });
      }
    }

    for (const payment of demoBorrower.payments) {
      const existing = await prisma.payment.findFirst({
        where: {
          userId: user.id,
          borrowerId: borrower.id,
          amount: payment.amount,
          paymentDate: new Date(payment.paymentDate),
          note: payment.note
        }
      });

      if (!existing) {
        await prisma.payment.create({
          data: {
            userId: user.id,
            borrowerId: borrower.id,
            ...payment,
            paymentDate: new Date(payment.paymentDate)
          }
        });
      }
    }
  }

  for (const text of notes) {
    const existing = await prisma.note.findFirst({ where: { userId: user.id, text } });
    if (!existing) await prisma.note.create({ data: { userId: user.id, text } });
  }

  console.log("Demo data ready");
  console.log(`Mobile: ${mobile}`);
  console.log(`Password: ${password}`);
  console.log(`Borrowers: ${borrowers.length}`);
  console.log(`Notes: ${notes.length}`);
}

async function main() {
  await seedAccount(process.env.USER_NAME ?? "Demo Lender", process.env.USER_MOBILE ?? "9999999999", process.env.USER_PASSWORD ?? "demo12345");
  await seedAccount(process.env.ADMIN_NAME ?? "Shubham", process.env.ADMIN_MOBILE ?? "8541064068", process.env.ADMIN_PASSWORD ?? "admin12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
