
import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { signAccess, signRefresh } from "../utils/jwt.js";

const prisma = new PrismaClient();

// Shared Schemas
const ISODate = z.coerce.date();
const LocationSchema = z.object({
  label: z.string().min(1),
  address: z.string().nullable().optional().transform((v) => v ?? null),
  lat: z.number().nullable().optional().transform((v) => v ?? null),
  lng: z.number().nullable().optional().transform((v) => v ?? null),
});

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  countryCode: z.string().min(2).max(5),
  phoneNumber: z.string().min(5).max(15),
});


export async function signup(req: Request, res: Response) {
    const { email, password, name, countryCode, phoneNumber } = SignupSchema.parse(req.body);
  
    // Check if email or phone already exists
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone: phoneNumber }] },
    });
    if (exists) return res.status(400).json({ error: "User already exists" });
  
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
  
    // Create user
    const user = await prisma.user.create({
      data: { email, phone: phoneNumber, countryCode, name, passwordHash },
    });
  
    // 🔑 Generate tokens
    const access = signAccess({ sub: user.id });
    const { token: refresh, jti, exp } = signRefresh({ sub: user.id });
  
    // Save session in DB
    await prisma.session.create({
      data: { userId: user.id, refreshJti: jti, expiresAt: exp },
    });
  
    return res.status(201).json({
      status: true,
      userId: user.id,
      access,
      refresh,
    });
  }
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(req: Request, res: Response) {
  const { email, password } = LoginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  const access = signAccess({ sub: user.id });
  const { token: refresh, jti, exp } = signRefresh({ sub: user.id });
  await prisma.session.create({ data: { userId: user.id, refreshJti: jti, expiresAt: exp } });

  return res.status(200).json({ access, refresh, user,status: true});
}

const CompleteProfileSchema = z.object({
  name: z.string().min(1).max(120),
  gender: z.enum(["male", "female", "other"]).optional(),
  birthDate: ISODate.optional(),
  avatarUrl: z.string().url().optional(),
  familyName: z.string().min(1).default("My Family"),
  roleInFamily: z.enum(["FATHER", "MOTHER", "SON", "DAUGHTER", "GRANDPARENTS", "OTHER"]).default("OTHER"),
  locations: z.array(LocationSchema).optional(),
});

export async function completeProfile(req: Request, res: Response) {
  const userId = (req as any).user?.sub;
  const { name, gender, birthDate, avatarUrl, familyName, roleInFamily, locations } =
    CompleteProfileSchema.parse(req.body);

  try {
    const result = await prisma.$transaction(async (tx:any) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { name, ...(gender && { gender }), ...(birthDate && { birthDate }), ...(avatarUrl && { avatarUrl }) },
      });

      const family = await tx.family.create({ data: { name: familyName, ownerId: userId } });
      await tx.familyMember.create({ data: { userId, familyId: family.id, role: roleInFamily } });

      if (locations?.length) {
        await tx.location.createMany({
          data: locations.map((l) => ({
            familyId: family.id,
            label: l.label,
            address: l.address,
            lat: l.lat,
            lng: l.lng,
          })),
        });
      }

      return { user, family };
    });

    return res.status(201).json({ status:true, ...result });
  } catch (err) {
    console.error("Complete profile error:", err);
    return res.status(500).json({ status:false, error: "Unable to complete registration" ,err});
  }
}

// You will need to implement signAccess & signRefresh functions or use your JWT auth layer here
