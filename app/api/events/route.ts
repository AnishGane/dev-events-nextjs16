import { Event } from "@/database";
import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

const API_AUTH_TOKEN: string | undefined = process.env.API_AUTH_TOKEN;

interface AuthFailureBody {
  message: string;
}

type AuthResult =
  | { ok: true }
  | { ok: false; response: NextResponse<AuthFailureBody> };

/**
 * Simple Bearer-token based authentication for events API routes.
 * Expects an Authorization: Bearer <token> header where <token>
 * matches the API_AUTH_TOKEN environment variable.
 */
function authenticateRequest(req: NextRequest): AuthResult {
  if (!API_AUTH_TOKEN) {
    console.error(
      "API_AUTH_TOKEN environment variable is not set. Authentication is misconfigured."
    );
    return {
      ok: false,
      response: NextResponse.json<AuthFailureBody>(
        {
          message: "Server authentication is not configured.",
        },
        { status: 500 }
      ),
    };
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    console.warn(
      "Unauthenticated request to /api/events: missing Authorization header."
    );
    return {
      ok: false,
      response: NextResponse.json<AuthFailureBody>(
        {
          message:
            "Authentication required. Provide a Bearer token in the Authorization header.",
        },
        { status: 401 }
      ),
    };
  }

  const [scheme, token] = authHeader.split(" ");

  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    console.warn(
      "Unauthenticated request to /api/events: invalid Authorization header format."
    );
    return {
      ok: false,
      response: NextResponse.json<AuthFailureBody>(
        {
          message:
            "Authentication required. Use 'Authorization: Bearer <token>'.",
        },
        { status: 401 }
      ),
    };
  }

  if (token !== API_AUTH_TOKEN) {
    console.warn("Unauthorized request to /api/events: invalid token.");
    return {
      ok: false,
      response: NextResponse.json<AuthFailureBody>(
        {
          message: "Invalid authentication token.",
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true };
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    await connectToDatabase();

    const formData = await req.formData();

    let event;
    try {
      event = Object.fromEntries(formData.entries());
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        {
          message: "Invalid JSON data format",
        },
        {
          status: 400,
        }
      );
    }

    const file = formData.get("image") as File;
    if (!file) {
      return NextResponse.json(
        { message: "Image is required" },
        { status: 400 }
      );
    }

    let tags: string[];
    let agenda: string[];
    try {
      tags = JSON.parse(formData.get("tags") as string);
      agenda = JSON.parse(formData.get("agenda") as string);
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON format for tags or agenda" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    //  uploadResult contains the image url stored on cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "devevent" },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    (event as { image: string }).image = (uploadResult as { secure_url: string }).secure_url;
    const createdEvent = await Event.create({
      ...event,
      tags: tags,
      agenda: agenda,
    });

    return NextResponse.json(
      { message: "Event Created Successfully.", event: createdEvent },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Event Creation failed",
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    await connectToDatabase();

    const events = await Event.find().sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Event Fetched Successfully.", events },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: "Event failed to fetch",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}