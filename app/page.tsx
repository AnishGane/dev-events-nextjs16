import EventCard from "@/components/EventCard";
import ExploreBtn from "@/components/ExploreBtn";
import { EventDocument } from "@/database";
// import { events } from "@/lib/constants";
import { cacheLife } from "next/cache";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_BASE_URL environment variable is not defined");
}

const page = async () => {
  "use cache";
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
          {events &&
            events
              .slice(0, 6)
              .map((event: EventDocument) => (
                <EventCard key={event.title} {...event} />
              ))}
        </ul>

        <div className="flex-center">
          <button className="mt-7 mx-auto border-dark-200 bg-dark-100 w-fit cursor-pointer  rounded-full border px-8 py-3.5  text-center">
            <a href="/events">See All Events</a>
          </button>
        </div>
      </div>
    </section>
  );
};

export default page;
