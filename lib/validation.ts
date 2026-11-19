import { z } from "zod";
import { shop } from "@/config/shop";
import { parseShopTime, todayDate } from "@/lib/time";

// Same rule as the Details screen: letters, spaces, hyphens, apostrophes.
const FIRST_NAME = /^\p{L}[\p{L} '’-]*$/u;

export const bookingSchema = z.object({
  service: z.string().refine((id) => shop.services.some((service) => service.id === id)),
  start: z.iso.datetime({ offset: true }).transform((value, ctx) => {
    const start = parseShopTime(value);
    if (todayDate(start) !== todayDate()) {
      ctx.addIssue({ code: "custom", message: "Start must be today" });
      return z.NEVER;
    }
    return start;
  }),
  firstName: z.string().trim().min(1).max(30).regex(FIRST_NAME),
  phone: z
    .string()
    .regex(/^\d{10}$/)
    .transform((digits) => `+1${digits}`),
});
