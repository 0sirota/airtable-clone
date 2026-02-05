import { z } from "zod";
import { Prisma } from "../../../../generated/prisma";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  filterConfigItemSchema,
  sortConfigItemSchema,
} from "~/server/api/types";
import { db } from "~/server/db";

export const rowRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.table.findFirstOrThrow({
        where: { id: input.tableId, base: { userId: ctx.session.user.id } },
      });
      return ctx.db.row.create({
        data: { tableId: input.tableId },
      });
    }),

  createMany: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        count: z.number().int().min(1).max(200000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.table.findFirstOrThrow({
        where: { id: input.tableId, base: { userId: ctx.session.user.id } },
        include: { columns: { orderBy: { order: "asc" } } },
      });
      const table = await ctx.db.table.findFirstOrThrow({
        where: { id: input.tableId },
        include: { columns: { orderBy: { order: "asc" } } },
      });
      const BATCH = 2000;
      let created = 0;
      const { faker } = await import("@faker-js/faker");
      for (let b = 0; b < input.count; b += BATCH) {
        const size = Math.min(BATCH, input.count - b);
        const rows = await ctx.db.row.createManyAndReturn({
          data: Array.from({ length: size }, () => ({ tableId: table.id })),
        });
        const cells: { rowId: string; columnId: string; valueText: string | null; valueNumber: number | null }[] = [];
        for (const row of rows) {
          for (const col of table.columns) {
            if (col.type === "NUMBER") {
              cells.push({
                rowId: row.id,
                columnId: col.id,
                valueText: null,
                valueNumber: faker.number.float({ min: 0, max: 10000, fractionDigits: 2 }),
              });
            } else {
              cells.push({
                rowId: row.id,
                columnId: col.id,
                valueText: faker.lorem.words(3),
                valueNumber: null,
              });
            }
          }
        }
        if (cells.length > 0) {
          await ctx.db.cell.createMany({ data: cells });
        }
        created += rows.length;
      }
      return { count: created };
    }),

  getInfinite: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().nullable().optional(),
        search: z.string().optional(),
        sortConfig: z.array(sortConfigItemSchema).optional(),
        filterConfig: z.array(filterConfigItemSchema).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirstOrThrow({
        where: { id: input.tableId, base: { userId: ctx.session.user.id } },
        include: { columns: { orderBy: { order: "asc" } } },
      });

      const hasSearch = !!input.search?.trim();
      const hasSort = input.sortConfig && input.sortConfig.length > 0;
      const hasFilter = input.filterConfig && input.filterConfig.length > 0;

      if (!hasSearch && !hasSort && !hasFilter) {
        const rows = await ctx.db.row.findMany({
          where: { tableId: input.tableId },
          take: input.limit + 1,
          ...(input.cursor && {
            cursor: { id: input.cursor },
            skip: 1,
          }),
          orderBy: { createdAt: "asc" },
          include: {
            cells: {
              where: { columnId: { in: table.columns.map((c) => c.id) } },
            },
          },
        });
        let nextCursor: string | undefined;
        if (rows.length > input.limit) {
          const next = rows.pop();
          nextCursor = next!.id;
        }
        return {
          rows,
          nextCursor,
          totalCount: null as number | null,
        };
      }

      const rowIds = await getFilteredSortedRowIds(
        db,
        input.tableId,
        input.limit + 1,
        input.cursor ?? null,
        input.search?.trim() ?? null,
        input.sortConfig ?? [],
        input.filterConfig ?? [],
        table.columns.map((c) => ({ id: c.id, type: c.type }))
      );

      const ids = rowIds.slice(0, input.limit);
      const nextCursor = rowIds.length > input.limit ? rowIds[input.limit]! : null;

      if (ids.length === 0) {
        return { rows: [], nextCursor: nextCursor ?? undefined, totalCount: 0 };
      }

      const rows = await ctx.db.row.findMany({
        where: { id: { in: ids } },
        include: {
          cells: {
            where: { columnId: { in: table.columns.map((c) => c.id) } },
          },
        },
      });

      const orderMap = new Map(ids.map((id, i) => [id, i]));
      rows.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

      return {
        rows,
        nextCursor: nextCursor ?? undefined,
        totalCount: null,
      };
    }),

  getTotalCount: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        search: z.string().optional(),
        filterConfig: z.array(filterConfigItemSchema).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await ctx.db.table.findFirstOrThrow({
        where: { id: input.tableId, base: { userId: ctx.session.user.id } },
        include: { columns: true },
      });
      const hasSearch = !!input.search?.trim();
      const hasFilter = input.filterConfig && input.filterConfig.length > 0;
      if (!hasSearch && !hasFilter) {
        const count = await ctx.db.row.count({
          where: { tableId: input.tableId },
        });
        return { count };
      }
      const ids = await getFilteredSortedRowIds(
        db,
        input.tableId,
        1000000,
        null,
        input.search?.trim() ?? null,
        [],
        input.filterConfig ?? [],
        []
      );
      return { count: ids.length };
    }),

  updateCell: protectedProcedure
    .input(
      z.object({
        rowId: z.string(),
        columnId: z.string(),
        valueText: z.string().nullable().optional(),
        valueNumber: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.db.row.findFirstOrThrow({
        where: {
          id: input.rowId,
          table: { base: { userId: ctx.session.user.id } },
        },
      });
      const column = await ctx.db.column.findFirstOrThrow({
        where: {
          id: input.columnId,
          tableId: row.tableId,
        },
      });
      return ctx.db.cell.upsert({
        where: {
          rowId_columnId: { rowId: input.rowId, columnId: input.columnId },
        },
        create: {
          rowId: input.rowId,
          columnId: input.columnId,
          valueText: input.valueText ?? null,
          valueNumber: input.valueNumber ?? null,
        },
        update: {
          ...(input.valueText !== undefined && { valueText: input.valueText }),
          ...(input.valueNumber !== undefined && { valueNumber: input.valueNumber }),
        },
      });
    }),
});

async function getFilteredSortedRowIds(
  db: typeof import("~/server/db").db,
  tableId: string,
  limit: number,
  cursor: string | null,
  search: string | null,
  sortConfig: { columnId: string; direction: "asc" | "desc" }[],
  filterConfig: {
    columnId: string;
    columnType: "TEXT" | "NUMBER";
    operator: string;
    value?: string | number;
  }[],
  columns: { id: string; type: string }[]
): Promise<string[]> {
  const conditions: Prisma.Sql[] = [Prisma.sql`r."tableId" = ${tableId}`];

  if (search) {
    const pattern = "%" + search + "%";
    conditions.push(
      Prisma.sql`EXISTS (SELECT 1 FROM "Cell" c2 WHERE c2."rowId" = r.id AND c2."valueText" ILIKE ${pattern})`
    );
  }

  for (const f of filterConfig) {
    if (f.columnType === "TEXT") {
      if (f.operator === "is_empty") {
        conditions.push(
          Prisma.sql`((SELECT c."valueText" FROM "Cell" c WHERE c."rowId" = r.id AND c."columnId" = ${f.columnId} LIMIT 1) IS NULL OR (SELECT c."valueText" FROM "Cell" c WHERE c."rowId" = r.id AND c."columnId" = ${f.columnId} LIMIT 1) = '')`
        );
      } else if (f.operator === "is_not_empty") {
        conditions.push(
          Prisma.sql`((SELECT c."valueText" FROM "Cell" c WHERE c."rowId" = r.id AND c."columnId" = ${f.columnId} LIMIT 1) IS NOT NULL AND (SELECT c."valueText" FROM "Cell" c WHERE c."rowId" = r.id AND c."columnId" = ${f.columnId} LIMIT 1) != '')`
        );
      } else if (f.operator === "contains" && typeof f.value === "string") {
        conditions.push(
          Prisma.sql`(SELECT c."valueText" FROM "Cell" c WHERE c."rowId" = r.id AND c."columnId" = ${f.columnId} LIMIT 1) ILIKE ${"%" + f.value + "%"}`
        );
      } else if (f.operator === "not_contains" && typeof f.value === "string") {
        conditions.push(
          Prisma.sql`((SELECT c."valueText" FROM "Cell" c WHERE c."rowId" = r.id AND c."columnId" = ${f.columnId} LIMIT 1) IS NULL OR (SELECT c."valueText" FROM "Cell" c WHERE c."rowId" = r.id AND c."columnId" = ${f.columnId} LIMIT 1) NOT ILIKE ${"%" + f.value + "%"})`
        );
      } else if (f.operator === "equal_to" && typeof f.value === "string") {
        conditions.push(
          Prisma.sql`(SELECT c."valueText" FROM "Cell" c WHERE c."rowId" = r.id AND c."columnId" = ${f.columnId} LIMIT 1) = ${f.value}`
        );
      }
    } else {
      const val = typeof f.value === "number" ? f.value : null;
      if (val !== null) {
        if (f.operator === "greater_than") {
          conditions.push(
            Prisma.sql`(SELECT c."valueNumber" FROM "Cell" c WHERE c."rowId" = r.id AND c."columnId" = ${f.columnId} LIMIT 1) > ${val}`
          );
        } else if (f.operator === "less_than") {
          conditions.push(
            Prisma.sql`(SELECT c."valueNumber" FROM "Cell" c WHERE c."rowId" = r.id AND c."columnId" = ${f.columnId} LIMIT 1) < ${val}`
          );
        } else if (f.operator === "equal_to") {
          conditions.push(
            Prisma.sql`(SELECT c."valueNumber" FROM "Cell" c WHERE c."rowId" = r.id AND c."columnId" = ${f.columnId} LIMIT 1) = ${val}`
          );
        }
      }
    }
  }

  const where = Prisma.join(conditions, " AND ");
  const cursorCond = cursor ? Prisma.sql`AND r.id > ${cursor}` : Prisma.empty;

  let orderBy: Prisma.Sql;
  if (sortConfig.length > 0) {
    const first = sortConfig[0]!;
    const dirRaw = first.direction === "asc" ? "ASC" : "DESC";
    const col = columns.find((c) => c.id === first.columnId);
    if (col?.type === "NUMBER") {
      orderBy = Prisma.sql`(SELECT c."valueNumber" FROM "Cell" c WHERE c."rowId" = r.id AND c."columnId" = ${first.columnId} LIMIT 1) ${Prisma.raw(dirRaw)} NULLS LAST`;
    } else {
      orderBy = Prisma.sql`(SELECT c."valueText" FROM "Cell" c WHERE c."rowId" = r.id AND c."columnId" = ${first.columnId} LIMIT 1) ${Prisma.raw(dirRaw)} NULLS LAST`;
    }
  } else {
    orderBy = Prisma.sql`r."createdAt" ASC`;
  }

  const raw = await db.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT r.id FROM "Row" r WHERE ${where} ${cursorCond} ORDER BY ${orderBy} LIMIT ${limit}`
  );
  return raw.map((r) => r.id);
}
