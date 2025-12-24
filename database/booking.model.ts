import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { Event, type EventDocument } from "./event.model";

// Attributes required to create a Booking
export interface BookingAttrs {
  eventId: Types.ObjectId;
  email: string;
}

// Full Booking document stored in MongoDB
export interface BookingDocument extends BookingAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

export type BookingModel = Model<BookingDocument>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BookingSchema = new Schema<BookingDocument, BookingModel>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true, // optimize queries filtering by event
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string): boolean => emailRegex.test(value),
        message: "Invalid email address",
      },
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
    versionKey: false,
  }
);

/**
 * Pre-save hook: verify the referenced event exists before creating a booking.
 *
 * This hook is async; throwing an error will reject the save operation.
 */
BookingSchema.pre<BookingDocument>("save", async function preSave() {
  const existingEvent: Pick<EventDocument, "_id"> | null = await Event.findById(this.eventId)
    .select("_id")
    .lean();

  if (!existingEvent) {
    throw new Error("Cannot create booking: referenced event does not exist");
  }
});

// Additional index for faster lookups by eventId if needed for aggregations
BookingSchema.index({ eventId: 1 });

// Reuse the model in development to avoid OverwriteModelError with HMR.
export const Booking: BookingModel =
  (mongoose.models.Booking as BookingModel) ||
  mongoose.model<BookingDocument, BookingModel>("Booking", BookingSchema);
