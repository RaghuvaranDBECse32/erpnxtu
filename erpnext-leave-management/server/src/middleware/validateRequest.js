/**
 * validateRequest.js – request body validation middleware using Zod.
 *
 * Usage:
 *   router.post("/leaves", validateRequest(leaveSchema), leaveController.create);
 */

const { z } = require("zod");

/**
 * Returns an Express middleware that validates req.body against the given Zod schema.
 * On failure it sends 400 with a list of field-level errors.
 */
const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Attach the parsed (coerced + sanitised) data so controllers use clean values
  req.validatedBody = result.data;
  next();
};

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

/**
 * Schema for POST /api/leaves
 * ERPNext dates must be ISO strings (YYYY-MM-DD).
 */
const leaveApplicationSchema = z
  .object({
    employee: z
      .string({ required_error: "Employee is required" })
      .min(1, "Employee is required"),

    leave_type: z
      .string({ required_error: "Leave type is required" })
      .min(1, "Leave type is required"),

    from_date: z
      .string({ required_error: "From date is required" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "from_date must be YYYY-MM-DD format"),

    to_date: z
      .string({ required_error: "To date is required" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "to_date must be YYYY-MM-DD format"),

    reason: z
      .string({ required_error: "Reason is required" })
      .min(3, "Reason must be at least 3 characters")
      .max(500, "Reason cannot exceed 500 characters"),
  })
  .refine((data) => new Date(data.to_date) >= new Date(data.from_date), {
    message: "to_date cannot be before from_date",
    path: ["to_date"],
  });

module.exports = { validateRequest, leaveApplicationSchema };
