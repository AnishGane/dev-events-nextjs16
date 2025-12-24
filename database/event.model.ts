import mongoose, { Schema, type Document, type Model } from "mongoose";

// Event attributes used when creating a new Event document
export interface EventAttrs {
  title: string;
  slug?: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // stored as normalized ISO date string (YYYY-MM-DD)
  time: string; // stored as normalized 24h time string (HH:mm)
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
}

// Full Event document type as stored in MongoDB
export interface EventDocument extends EventAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

export type EventModel = Model<EventDocument>;

// Helper to enforce non-empty trimmed strings on required fields
const requiredNonEmptyString = {
  type: String,
  required: true,
  trim: true,
  validate: {
    validator: (value: string): boolean => value.trim().length > 0,
    message: "Field is required and cannot be empty",
  },
};

const EventSchema = new Schema<EventDocument, EventModel>(
  {
    title: requiredNonEmptyString,
    slug: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
    description: requiredNonEmptyString,
    overview: requiredNonEmptyString,
    image: requiredNonEmptyString,
    venue: requiredNonEmptyString,
    location: requiredNonEmptyString,
    date: {
      ...requiredNonEmptyString,
      // normalized to YYYY-MM-DD in a pre-save hook
    },
    time: {
      ...requiredNonEmptyString,
      // normalized to HH:mm (24-hour) in a pre-save hook
    },
    mode: requiredNonEmptyString,
    audience: requiredNonEmptyString,
    agenda: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]): boolean =>
          Array.isArray(value) && value.length > 0 && value.every((item) => item.trim().length > 0),
        message: "Agenda must be a non-empty array of non-empty strings",
      },
    },
    organizer: requiredNonEmptyString,
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]): boolean =>
          Array.isArray(value) && value.length > 0 && value.every((item) => item.trim().length > 0),
        message: "Tags must be a non-empty array of non-empty strings",
      },
    },
  },
  {
    timestamps: true, // automatically manages createdAt and updatedAt
    versionKey: false,
  }
);

/**
 * Generate a URL-safe slug from the event title.
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric chars
    .replace(/\s+/g, "-") // replace whitespace with dashes
    .replace(/-+/g, "-"); // collapse multiple dashes
}

/**
 * Normalize date to YYYY-MM-DD and time to HH:mm (24h).
 * Throws if values are invalid.
 */
function normalizeDateAndTime(doc: EventDocument): void {
  // Normalize date
  const parsedDate = new Date(doc.date);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Invalid date format. Use a parseable date (e.g., YYYY-MM-DD or ISO 8601)");
  }
  doc.date = parsedDate.toISOString().split("T")[0];

  // Normalize time to HH:mm 24-hour format
  const time = doc.time.trim();
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/; // HH:mm

  if (!timePattern.test(time)) {
    throw new Error("Invalid time format. Use HH:mm in 24-hour format (e.g., 09:00, 18:30)");
  }

  doc.time = time;
}

/**
 * Pre-save hook: generate slug (only when title changes) and
 * normalize date/time into canonical formats.
 *
 * This hook runs synchronously; throwing an error will abort the save.
 */
EventSchema.pre<EventDocument>("save", function preSave() {
  if (this.isModified("title") || !this.slug) {
    this.slug = slugify(this.title);
  }

  normalizeDateAndTime(this);
});

// Reuse the model in development to avoid OverwriteModelError with HMR.
export const Event: EventModel =
  (mongoose.models.Event as EventModel) || mongoose.model<EventDocument, EventModel>("Event", EventSchema);
