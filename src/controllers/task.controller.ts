// src/controllers/task.controller.ts
import { Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CreateCustomTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string(),
  assignedTo: z.string(),
  date: z.coerce.date(),
  timeOfDay: z.enum(["morning", "afternoon", "evening"]).optional(),
  repeat: z.enum(["daily", "weekly", "monthly", "once"]).optional(),
  reward: z.string().optional(),
  visibility: z.enum(["public", "private", "family"]).optional(),
  complexity: z.enum(["easy", "medium", "hard"]).optional(),
  popularity: z.enum(["viral", "trending", "normal"]).optional(),
  imageUrl: z.string().url().optional(),
});

// export async function createCustomTask(req: Request, res: Response) {
//   const userId = (req as any).user?.sub;
//   const input = CreateCustomTaskSchema.safeParse(req.body);
//   if (!input.success) return res.status(400).json({ error: input.error.flatten() });

//   const {
//     title, description, categoryId, assignedTo,
//     date, timeOfDay, repeat, reward,
//     visibility, complexity, popularity, imageUrl
//   } = input.data;

//   try {
//     const result = await prisma.$transaction(async (tx) => {
//       const template = await tx.taskTemplate.create({
//         data: {
//           title,
//           description,
//           reward,
//           complexity,
//           popularity,
//           imageUrl,
//           categoryId,
//           createdById: userId,
//         }
//       });

//       const task = await tx.task.create({
//         data: {
//           title,
//           description,
//           date,
//           categoryId,
//           templateId: template.id,
//           assignedTo,
//           createdById: userId,
//           timeOfDay,
//           repeat,
//           reward,
//           visibility,
//           complexity,
//           popularity,
//         }
//       });

//       return { template, task };
//     });

//     return res.status(201).json({ status: true, ...result });
//   } catch (err) {
//     console.error("Create custom task error:", err);
//     return res.status(500).json({ status: false, error: "Failed to create custom task" });
//   }
// }
export async function createAndAssignTask(req: Request, res: Response) {
  const userId = (req as any).user?.sub;

  const {
    title,
    description,
    date,
    categoryId,
    templateId,
    reward,
    visibility,
    complexity,
    popularity,
    timeOfDay,
    repeat,
    assignedMemberIds = [], // array of familyMemberId strings
  } = req.body;

  try {
    // Step 1: Create the task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        date: new Date(date),
        categoryId,
        createdById: userId,
        templateId,
        reward,
        visibility,
        complexity,
        popularity,
        timeOfDay,
        repeat,
      },
    });

    // Step 2: Create task assignments for each family member
    const assignments = await Promise.all(
      assignedMemberIds.map((familyMemberId: string) =>
        prisma.taskAssignment.create({
          data: {
            taskId: task.id,
            familyMemberId,
          },
        })
      )
    );

    // Step 3: Return full task with its assignments
    const fullTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        category: true,
        template: true,
        assignments: {
          include: {
            familyMember: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return res.json({ status: true, task: fullTask });
  } catch (err) {
    console.error("Error creating task:", err);
    return res.status(500).json({ status: false, error: "Failed to create task" });
  }
}
export async function getTasks(req: Request, res: Response) {
  const userId = (req as any).user?.sub;
  const categoryId = req.query.categoryId as string | undefined;

  try {
    const member = await prisma.familyMember.findFirst({ where: { userId } });
    if (!member) return res.status(404).json({ error: "Family not found" });

    const templates = await prisma.taskTemplate.findMany({
      where: {
        AND: [
          {
            OR: [
              { createdById: null },
              { createdById: userId },
            ]
          },
          ...(categoryId ? [{ categoryId }] : [])
        ]
      },
      include: {
        category: true
      }
    });

    return res.json({ status: true, templates });
  } catch (err) {
    console.error("Get task templates error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch task templates" });
  }
}

export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      include: { templates: true }
    });
    return res.json({ status: true, categories });
  } catch (err) {
    console.error("Get categories error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch categories" });
  }
}


/** ...your existing code... */

// ===== Add Category =====
const CreateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  iconUrl: z.string().url().optional(), // optional if uploading a file
});

export async function addCategory(req: Request, res: Response) {
  // If you're using Multer, req.file may hold the uploaded icon
  const parsed = CreateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ status: false, error: parsed.error.flatten() });
  }

  const { name, iconUrl: iconUrlFromBody } = parsed.data;

  try {
    // Prefer uploaded file over provided URL
    const file = req.file as Express.Multer.File | undefined;
    const iconUrl = file ? `/uploads/${file.filename}` : iconUrlFromBody ?? null;

    // (Optional) prevent duplicate names (case-sensitive simple check)
    const exists = await prisma.category.findFirst({ where: { name } });
    if (exists) {
      return res.status(409).json({ status: false, error: "Category already exists" });
    }

    const category = await prisma.category.create({
      data: {
        name,
        ...(iconUrl ? { iconUrl } : {}),
      },
    });

    return res.status(201).json({ status: true, category });
  } catch (err) {
    console.error("Add category error:", err);
    return res.status(500).json({ status: false, error: "Failed to add category" });
  }
}
