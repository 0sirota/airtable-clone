import { z } from "zod";

export const columnTypeSchema = z.enum(["TEXT", "NUMBER"]);
export type ColumnType = z.infer<typeof columnTypeSchema>;

export const sortDirectionSchema = z.enum(["asc", "desc"]);
export type SortDirection = z.infer<typeof sortDirectionSchema>;

export const textFilterOperatorSchema = z.enum([
  "is_empty",
  "is_not_empty",
  "contains",
  "not_contains",
  "equal_to",
]);
export type TextFilterOperator = z.infer<typeof textFilterOperatorSchema>;

export const numberFilterOperatorSchema = z.enum(["greater_than", "less_than", "equal_to"]);
export type NumberFilterOperator = z.infer<typeof numberFilterOperatorSchema>;

export const filterConfigItemSchema = z.discriminatedUnion("columnType", [
  z.object({
    columnId: z.string(),
    columnType: z.literal("TEXT"),
    operator: textFilterOperatorSchema,
    value: z.string().optional(),
  }),
  z.object({
    columnId: z.string(),
    columnType: z.literal("NUMBER"),
    operator: numberFilterOperatorSchema,
    value: z.number().optional(),
  }),
]);
export type FilterConfigItem = z.infer<typeof filterConfigItemSchema>;

export const sortConfigItemSchema = z.object({
  columnId: z.string(),
  direction: sortDirectionSchema,
});
export type SortConfigItem = z.infer<typeof sortConfigItemSchema>;
