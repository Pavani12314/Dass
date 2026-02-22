// Script to clean up orphaned events (events with missing or null organizers)
// Usage: node cleanupOrphanedEvents.js

const mongoose = require('mongoose');
const Event = require('./models/Event');
const Organizer = require('./models/Organizer');

const MONGO_URI = process.env.MONGO_URI || 'MONGO_URI=mongodb+srv://felicityUser:felicity123@cluster0.gnkea.mongodb.net/felicityD';

async function cleanupOrphanedEvents() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Find all valid organizer IDs
  const organizers = await Organizer.find({}, '_id');
  const validOrganizerIds = organizers.map(org => org._id.toString());

  // Find orphaned events
  const orphanedEvents = await Event.find({
    $or: [
      { organizer: { $exists: false } },
      { organizer: null },
      { organizer: { $nin: validOrganizerIds } }
    ]
  });

  if (orphanedEvents.length === 0) {
    console.log('No orphaned events found.');
  } else {
    console.log(`Found ${orphanedEvents.length} orphaned events. Deleting...`);
    const ids = orphanedEvents.map(e => e._id);
    await Event.deleteMany({ _id: { $in: ids } });
    console.log('Deleted all orphaned events.');
  }

  await mongoose.disconnect();
}

cleanupOrphanedEvents().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
