import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.holidays.list.path, async (req, res) => {
    try {
      const response = await fetch("https://www.1823.gov.hk/common/ical/gc/en.json");
      if (!response.ok) {
        throw new Error("Failed to fetch holidays from gov.hk");
      }
      
      const data = await response.json();
      const holidays: string[] = [];
      
      if (data && data.vcalendar && data.vcalendar[0] && data.vcalendar[0].vevent) {
        const events = data.vcalendar[0].vevent;
        for (const event of events) {
          // The format from the API is "dtstart": ["YYYYMMDD", {"value": "DATE"}]
          if (event.dtstart && event.dtstart[0]) {
            holidays.push(event.dtstart[0]);
          }
        }
      }
      
      res.status(200).json(holidays);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      res.status(500).json({ message: "Failed to fetch holidays" });
    }
  });

  return httpServer;
}
