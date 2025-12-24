import EventCard from "@/components/EventCard";
import { EventDocument } from "@/database";
import { cacheLife } from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const page = async () => {
  "use cache";
  cacheLife("hours");
  const response = await fetch(`${BASE_URL}/api/events`);
  const { events } = await response.json();
  return (
    <div className="mt-10">
      <div>
        <h3>All Events</h3>
        <p>You can find all events here</p>
      </div>

      <div className="mt-10 events">
        {events &&
          events.map((item: EventDocument, index: number) => (
            <EventCard key={index} {...item} />
          ))}
      </div>
    </div>
  );
};

export default page;
