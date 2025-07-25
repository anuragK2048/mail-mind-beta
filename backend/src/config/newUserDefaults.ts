export const newUserDefaults = {
  defaultLabels: [
    {
      name: "Travel",
      prompt:
        "Classify this email if it relates to travel, such as flight confirmations, hotel bookings, rental car reservations, travel itineraries, or visa information.",
      color: "#b0f566",
    },
    {
      name: "Action Required",
      prompt:
        "Classify this email if it contains a direct question, a request for a specific action, a task assignment, or a clear deadline that the recipient needs to act upon.",
      color: "#6638f0",
    },
    {
      name: "Meeting & Calendar",
      prompt:
        "Classify this email if it is a calendar invitation, a meeting request, an agenda for a meeting, a scheduling confirmation (like from Calendly), or a discussion about setting up a meeting.",
      color: "#5cc9f5",
    },
  ],
};
