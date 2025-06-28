import { z } from "zod";

export const submissionSchema = z.object({
  datasetName: z.string().min(1, "Dataset name is required").max(255),
  datasetUrl: z.string().url("Must be a valid URL"),
  datasetOwner: z.enum([
    "Public Sector",
    "Private Sector",
    "Academic/Research",
    "Non-profit",
    "Other",
  ]),
  ownerName: z.string().min(1, "Owner name is required").max(255),
  description: z.string().min(1, "Description is required").max(500),
  missingType: z.enum(["Both", "USRN", "UPRN"]),
  jobTitle: z.string().max(255).optional().or(z.literal("")),
  sector: z.enum([
    "Public Sector",
    "Private Sector",
    "Academic/Research",
    "Non-profit",
    "Other",
  ]),
});

export type SubmissionData = z.infer<typeof submissionSchema>;
