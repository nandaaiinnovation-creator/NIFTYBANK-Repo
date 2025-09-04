const fetch = require('node-fetch');

class NewsEngine {
    constructor(wss) {
        this.wss = wss;
        this.apiKey = null;
        this.status = 'inactive';
        this.message = 'Provide API key to activate.';
        this.scheduledEvents = [];
        this.apiCallCount = 0;
        this.schedulerInterval = null;
    }

    _broadcastStatus() {
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify({
                    type: 'news_status_update',
                    payload: {
                        status: this.status,
                        message: this.message,
                        events: this.scheduledEvents,
                    }
                }));
            }
        });
    }

    async initializeForDay(apiKey) {
        if (!apiKey) throw new Error("API Key for news service is required.");
        this.apiKey = apiKey;
        this.apiCallCount = 0;
        this.status = 'initializing';
        this.message = 'Fetching economic calendar...';
        this._broadcastStatus();

        try {
            const url = `https://www.alphavantage.co/query?function=ECONOMIC_CALENDAR&horizon=7day&apikey=${this.apiKey}`;
            if (this.apiCallCount >= 23) throw new Error("Daily API call limit reached.");

            this.apiCallCount++;
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Alpha Vantage API error: ${response.status} ${errorText}`);
            }

            const csvData = await response.text();
            this._parseAndScheduleEvents(csvData);

            this.status = 'monitoring';
            this.message = `Monitoring ${this.scheduledEvents.length} high-impact event(s).`;
            this._broadcastStatus();

            if (this.schedulerInterval) clearInterval(this.schedulerInterval);
            this.schedulerInterval = setInterval(() => this._checkEvents(), 30 * 1000); // Check every 30 seconds

        } catch (error) {
            console.error("NewsEngine initialization failed:", error);
            this.status = 'error';
            this.message = `Failed to fetch news: ${error.message}`;
            this._broadcastStatus();
            throw error;
        }
    }

    _parseAndScheduleEvents(csvData) {
        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',');
        const events = lines.slice(1).map(line => {
            const values = line.split(',');
            const event = {};
            headers.forEach((header, i) => event[header] = values[i]);
            return event;
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const highImpactEvents = events.filter(e => {
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
        console.log(`[NewsEngine] Found ${this.scheduledEvents.length} high-impact events for today.`);
    }

    _checkEvents() {
        if (this.scheduledEvents.length === 0) {
            global.currentNewsEvent = null;
            return;
        };

        const now = new Date();
        let eventActive = null;

        for (const event of this.scheduledEvents) {
            const eventTime = new Date(event.time);
            const preEventTime = new Date(eventTime.getTime() - 5 * 60 * 1000); // 5 mins before
            const postEventTime = new Date(eventTime.getTime() + 10 * 60 * 1000); // 10 mins after

            if (now >= preEventTime && now <= postEventTime) {
                eventActive = { name: event.event, impact: event.impact };
                break;
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
}

module.exports = NewsEngine;
