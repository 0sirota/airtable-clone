import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const baseRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.base.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { updatedAt: "desc" },
      include: { tables: { orderBy: { createdAt: "asc" } } },
    });
  }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const base = await ctx.db.base.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          tables: { orderBy: { createdAt: "asc" }, include: { columns: { orderBy: { order: "asc" } } } },
        },
      });
      if (!base) throw new Error("Base not found");
      return base;
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.base.create({
        data: {
          name: input.name,
          userId: ctx.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.base.findFirstOrThrow({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      return ctx.db.base.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.base.findFirstOrThrow({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      return ctx.db.base.delete({ where: { id: input.id } });
    }),
});
