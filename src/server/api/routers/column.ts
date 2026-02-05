import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { ColumnType } from "../../../../generated/prisma";

export const columnRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        name: z.string().min(1),
        type: z.enum(["TEXT", "NUMBER"]),
        order: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.table.findFirstOrThrow({
        where: { id: input.tableId, base: { userId: ctx.session.user.id } },
      });
      const maxOrder = await ctx.db.column.aggregate({
        where: { tableId: input.tableId },
        _max: { order: true },
      });
      const order = input.order ?? (maxOrder._max.order ?? -1) + 1;
      return ctx.db.column.create({
        data: {
          tableId: input.tableId,
          name: input.name,
          type: input.type as ColumnType,
          order,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        type: z.enum(["TEXT", "NUMBER"]).optional(),
        order: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const col = await ctx.db.column.findFirstOrThrow({
        where: { id: input.id, table: { base: { userId: ctx.session.user.id } } },
      });
      return ctx.db.column.update({
        where: { id: input.id },
        data: {
          ...(input.name != null && { name: input.name }),
          ...(input.type != null && { type: input.type as ColumnType }),
          ...(input.order != null && { order: input.order }),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.column.findFirstOrThrow({
        where: { id: input.id, table: { base: { userId: ctx.session.user.id } } },
      });
      return ctx.db.column.delete({ where: { id: input.id } });
    }),
});
