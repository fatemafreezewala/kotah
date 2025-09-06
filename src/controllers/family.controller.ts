import { Request, Response } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const AddFamilyMemberSchema = z.object({
  name: z.string().min(1),
  role: z.enum(["FATHER", "MOTHER", "SON", "DAUGHTER", "OTHER", "GRANDPARENTS"]),
  email: z.string().email().optional(),
  phone: z.string().min(5).max(15).optional(),
  countryCode: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

// Add a new family member (child/grandparent supported)
export async function addFamilyMember(req: Request, res: Response) {
  const userId = (req as any).user?.sub;
  const { familyId } = req.params;

  const { name, role, email, phone, countryCode, avatarUrl } = AddFamilyMemberSchema.parse(req.body);

  try {
    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) return res.status(404).json({ error: "Family not found" });

    let user = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          countryCode,
          avatarUrl,
          loginCode: (!email && !phone) ? nanoid(6).toUpperCase() : undefined,
        },
      });
    }

    const familyMember = await prisma.familyMember.create({
      data: {
        userId: user.id,
        familyId,
        role,
      },
    });

    return res.status(201).json({
      status: true,
      userId: user.id,
      familyMemberId: familyMember.id,
      loginCode: user.loginCode ?? null,
    });
  } catch (err) {
    console.error("Add family member error:", err);
    return res.status(500).json({ error: "Unable to add family member" });
  }
}

// Get all members of a family
export async function getFamilyMembers(req: Request, res: Response) {
  const { familyId } = req.params;

  try {
    const members = await prisma.familyMember.findMany({
      where: { familyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            loginCode: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: true,
      members: members.map((m:any) => ({
        id: m.id,
        role: m.role,
        createdAt: m.createdAt,
        ...m.user,
      })),
    });
  } catch (err) {
    console.error("Get family members error:", err);
    return res.status(500).json({ error: "Unable to fetch family members" });
  }
}
