"use client";

import React, { useState } from "react";

const BookEvent = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
  }
  return (
    <div id="book-event">
      {submitted ? (
        <p>Thank you for booking! We will get back to you soon.</p>
      ) : (
        <form
          onSubmit={handleSubmit}
        >
          <div>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button type="submit" className="button-submit">Book Now</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BookEvent;
