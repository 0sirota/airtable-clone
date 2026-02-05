import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { ColumnType } from "../../../../generated/prisma";
import { faker } from "@faker-js/faker";

export const tableRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ baseId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ctx.db.base.findFirstOrThrow({
        where: { id: input.baseId, userId: ctx.session.user.id },
      });
      return ctx.db.table.findMany({
        where: { baseId: input.baseId },
        orderBy: { createdAt: "asc" },
        include: { columns: { orderBy: { order: "asc" } } },
      });
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.id, base: { userId: ctx.session.user.id } },
        include: {
          columns: { orderBy: { order: "asc" } },
          base: true,
        },
      });
      if (!table) throw new Error("Table not found");
      return table;
    }),

  create: protectedProcedure
    .input(z.object({ baseId: z.string(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.base.findFirstOrThrow({
        where: { id: input.baseId, userId: ctx.session.user.id },
      });
      const table = await ctx.db.table.create({
        data: {
          baseId: input.baseId,
          name: input.name,
        },
      });
      const col1 = await ctx.db.column.create({
        data: { tableId: table.id, name: "Name", type: ColumnType.TEXT, order: 0 },
      });
      const col2 = await ctx.db.column.create({
        data: { tableId: table.id, name: "Score", type: ColumnType.NUMBER, order: 1 },
      });
      for (let i = 0; i < 5; i++) {
        const row = await ctx.db.row.create({ data: { tableId: table.id } });
        await ctx.db.cell.create({
          data: {
            rowId: row.id,
            columnId: col1.id,
            valueText: faker.person.fullName(),
            valueNumber: null,
          },
        });
        await ctx.db.cell.create({
          data: {
            rowId: row.id,
            columnId: col2.id,
            valueText: null,
            valueNumber: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
          },
        });
      }
      return ctx.db.table.findUniqueOrThrow({
        where: { id: table.id },
        include: { columns: { orderBy: { order: "asc" } } },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.table.findFirstOrThrow({
        where: { id: input.id, base: { userId: ctx.session.user.id } },
      });
      return ctx.db.table.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.table.findFirstOrThrow({
        where: { id: input.id, base: { userId: ctx.session.user.id } },
      });
      return ctx.db.table.delete({ where: { id: input.id } });
    }),
});
