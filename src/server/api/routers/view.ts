import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  filterConfigItemSchema,
  sortConfigItemSchema,
} from "~/server/api/types";

const columnVisibilitySchema = z.record(z.string(), z.boolean());

export const viewRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ctx.db.table.findFirstOrThrow({
        where: { id: input.tableId, base: { userId: ctx.session.user.id } },
      });
      return ctx.db.view.findMany({
        where: { tableId: input.tableId },
        orderBy: { updatedAt: "desc" },
      });
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const view = await ctx.db.view.findFirst({
        where: {
          id: input.id,
          table: { base: { userId: ctx.session.user.id } },
        },
      });
      if (!view) throw new Error("View not found");
      return view;
    }),

  create: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        name: z.string().min(1),
        sortConfig: z.array(sortConfigItemSchema).optional(),
        filterConfig: z.array(filterConfigItemSchema).optional(),
        columnVisibility: columnVisibilitySchema.optional(),
        searchQuery: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.table.findFirstOrThrow({
        where: { id: input.tableId, base: { userId: ctx.session.user.id } },
      });
      return ctx.db.view.create({
        data: {
          tableId: input.tableId,
          name: input.name,
          sortConfig: (input.sortConfig ?? []) as object,
          filterConfig: (input.filterConfig ?? []) as object,
          columnVisibility: (input.columnVisibility ?? {}) as object,
          searchQuery: input.searchQuery ?? null,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        sortConfig: z.array(sortConfigItemSchema).optional(),
        filterConfig: z.array(filterConfigItemSchema).optional(),
        columnVisibility: columnVisibilitySchema.optional(),
        searchQuery: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.view.findFirstOrThrow({
        where: {
          id: input.id,
          table: { base: { userId: ctx.session.user.id } },
        },
      });
      const { id, ...data } = input;
      return ctx.db.view.update({
        where: { id: id! },
        data: {
          ...(data.name != null && { name: data.name }),
          ...(data.sortConfig != null && { sortConfig: data.sortConfig as object }),
          ...(data.filterConfig != null && { filterConfig: data.filterConfig as object }),
          ...(data.columnVisibility != null && { columnVisibility: data.columnVisibility as object }),
          ...(data.searchQuery !== undefined && { searchQuery: data.searchQuery }),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.view.findFirstOrThrow({
        where: {
          id: input.id,
          table: { base: { userId: ctx.session.user.id } },
        },
      });
      return ctx.db.view.delete({ where: { id: input.id } });
    }),
});
