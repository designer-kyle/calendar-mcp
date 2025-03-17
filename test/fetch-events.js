import { authorize, listEvents } from '../src/index.js';

async function main() {
  try {
    const auth = await authorize();
    const events = await listEvents(auth);
    
    console.log('Upcoming events:');
    if (events.length === 0) {
      console.log('No upcoming events found.');
      return;
    }

    events.forEach((event) => {
      const start = event.start.dateTime || event.start.date;
      console.log(`${start} - ${event.summary}`);
    });
  } catch (err) {
    console.error('Error:', err);
  }
}

main(); 