// NewsEngine.js
// - Uses Alpha Vantage economic/calendar endpoint if available (defensive)
// - Ensures no more than 23 API calls per day (caches daily results)
// - Publishes status and currentNewsEvent via websocket

const fetch = require('node-fetch');

class NewsEngine {
  constructor(wss) {
    this.wss = wss;
    this.apiKey = null;
    this.status = 'inactive'; // changed from idle to match frontend types
    this.message = 'Provide API key to activate.';
    this.scheduledEvents = [];
    this.apiCallCount = 0;
    this.schedulerInterval = null;
    this._av = {
      lastFetchDate: null,
      callsToday: 0,
      maxCallsPerDay: 23,
      cachedData: null
    };
  }

  _broadcast(payload) {
    this.wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify(payload));
        }
    });
  }

  async initializeForDay(apiKey) {
    if (!apiKey) throw new Error("API Key for news service is required.");
    this.apiKey = apiKey;
    this.status = 'initializing';
    this.message = 'Fetching economic calendar...';
    this._broadcastStatus();

    try {
        await this._fetchAndCacheCalendarForToday();

        this.status = 'monitoring';
        this.message = `Monitoring ${this.scheduledEvents.length} high-impact event(s).`;
        this._broadcastStatus();

        if (this.schedulerInterval) clearInterval(this.schedulerInterval);
        this.schedulerInterval = setInterval(() => this._checkEvents(), 30 * 1000); // Check every 30 seconds

    } catch (error) {
        console.error("NewsEngine initialization failed:", error);
        this.status = 'error';
        this.message = `Failed to fetch news: ${error.message}`;
        this._broadcast({ type: 'news_status_update', payload: { status: this.status, message: this.message, events: [] } });
        throw error;
    }
  }

   async _fetchAndCacheCalendarForToday() {
    const todayStr = (new Date()).toISOString().slice(0,10);
    if (this._av.lastFetchDate === todayStr && this._av.cachedData) {
      this.scheduledEvents = this._av.cachedData;
      return;
    }

    if (this._av.lastFetchDate !== todayStr) {
      this._av.callsToday = 0;
      this._av.lastFetchDate = todayStr;
    }

    if (this._av.callsToday >= this._av.maxCallsPerDay) {
      console.warn("AlphaVantage call limit reached; using cached events if available.");
      this.scheduledEvents = this._av.cachedData || [];
      return;
    }

    const url = `https://www.alphavantage.co/query?function=ECONOMIC_CALENDAR&horizon=7day&apikey=${this.apiKey}`;
    try {
      this._av.callsToday += 1;
      const res = await fetch(url);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Alpha Vantage API error: ${res.status} ${errorText}`);
      }

      const csvData = await res.text();
      this._parseAndScheduleEvents(csvData);
      this._av.cachedData = this.scheduledEvents;
      console.log(`NewsEngine: fetched ${this.scheduledEvents.length} high-impact events for today.`);

    } catch (e) {
      console.warn("Failed to fetch or parse AlphaVantage calendar:", e.message);
      this.scheduledEvents = this._av.cachedData || [];
      // Re-throw to be caught by initializeForDay
      throw e;
    }
  }

  _parseAndScheduleEvents(csvData) {
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
          this.scheduledEvents = [];
          return;
      }
      const headers = lines[0].split(',');
      const events = lines.slice(1).map(line => {
          const values = line.split(',');
          const event = {};
          headers.forEach((header, i) => event[header.trim()] = values[i]);
          return event;
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const highImpactEvents = events.filter(e => {
          if (!e.release_date) return false;
          const eventDate = new Date(e.release_date);
          return e.impact === 'High' && 
                 (e.currency === 'INR' || e.currency === 'USD') &&
                 eventDate.setHours(0, 0, 0, 0) === today.getTime();
      }).map(e => ({
          time: `${e.release_date}T${e.release_time}`,
          event: e.event,
          impact: e.impact,
          currency: e.currency,
      }));

      this.scheduledEvents = highImpactEvents;
  }

  _checkEvents() {
    const now = new Date();
    let eventActive = null;

    for (const event of this.scheduledEvents) {
        try {
            const eventTime = new Date(event.time);
            if (isNaN(eventTime.getTime())) continue; // Skip invalid dates
            const preEventTime = new Date(eventTime.getTime() - 5 * 60 * 1000); // 5 mins before
            const postEventTime = new Date(eventTime.getTime() + 10 * 60 * 1000); // 10 mins after

            if (now >= preEventTime && now <= postEventTime) {
                eventActive = { name: event.event, impact: event.impact };
                break;
            }
        } catch (e) {
            console.warn("Error parsing event time:", event.time);
        }
    }
    
    const wasInSafeMode = !!global.currentNewsEvent;
    const isInSafeMode = !!eventActive;
    
    if (wasInSafeMode !== isInSafeMode) {
         global.currentNewsEvent = eventActive;
         if(isInSafeMode) {
             this.status = 'safe_mode';
             this.message = `SAFE MODE: Near ${eventActive.name} event.`;
             console.log(`[NewsEngine] Entering Safe Mode for event: ${eventActive.name}`);
         } else {
             this.status = 'monitoring';
             this.message = `Monitoring ${this.scheduledEvents.length} high-impact event(s).`;
             console.log(`[NewsEngine] Exiting Safe Mode.`);
         }
         this._broadcastStatus();
    }
  }

  _broadcastStatus() {
    this._broadcast({
        type: 'news_status_update',
        payload: {
            status: this.status,
            message: this.message,
            events: this.scheduledEvents,
        }
    });
  }

  shutdown() {
    if (this.schedulerInterval) clearInterval(this.schedulerInterval);
    console.log("NewsEngine shutdown complete.");
  }
}

module.exports = NewsEngine;
