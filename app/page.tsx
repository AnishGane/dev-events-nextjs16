import EventCard from "@/components/EventCard";
import ExploreBtn from "@/components/ExploreBtn";
import { EventDocument } from "@/database";
import { cacheLife } from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const page = async () => {
  'use cache';

  cacheLife("hours");
  const response = await fetch(`${BASE_URL}/api/events`);
  const { events } = await response.json();
  return (
    <section>
      <h1 className="text-center">
        The Hub for Every Dev <br /> Event You Must Not Miss
      </h1>
      <p className="text-center mt-5">
        Hackathons, Meetups, and Conferences, All in One Place
      </p>

      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>Featured Event</h3>

        <ul className="events">
          {events && events.map((event: EventDocument) => (
            <EventCard key={event.title} {...event} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default page;
