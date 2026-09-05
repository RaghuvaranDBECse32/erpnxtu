/**
 * validateRequest.js – Request body validation middleware using Zod for RecoverAI.
 */

const { z } = require("zod");

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

  req.validatedBody = result.data;
  next();
};

const recoverySimulationSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  amount: z.number().positive("Amount must be positive"),
  payment_method: z.enum(["UPI", "CARD", "NETBANKING", "WALLET"]),
  failure_reason: z.string().min(1, "Failure reason is required"),
});

module.exports = { validateRequest, recoverySimulationSchema };
