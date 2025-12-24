"use server";

import { Booking } from "@/database";
import { connectToDatabase } from "../mongodb";

interface CreateBookingInput {
  eventId: string;
  email: string;
}

export const createBooking = async ({ eventId, email }: CreateBookingInput) => {
  try {
    await connectToDatabase();

    await Booking.create({ eventId, email });

    return { success: true };
  } catch (e) {
    console.error("create booking failed", e);
    return { success: false };
  }
};
