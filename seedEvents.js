import eventsData from './events.json' assert { type: 'json' };
import { connect, db } from './db.js';


const flagshipNames = [
    "Hand Holding Nature",
    "Fireless Cooking", 
    "Debate",
    "Group Dance",
    "Free Fire",
    "Short Drama / Skit",
    "Quiz",
    "Mr. and Ms. Sparkz",
    "Battle of Bands",
    "Sparkz One-Minute Short Film",
    "Cinema Quiz", // Added based on context if needed, but strict list is above
    "Dance Battle" // "Battle of Bands" is music, "Dance Battle" might be flagship?
    // Prompt list: "Group Dance", "Battle of Bands".
    // "Dance Battle" id 1. "Group Dance" id 3.
];

// Normalize flagship names for comparison
const normalizedFlagships = flagshipNames.map(n => n.toLowerCase());


const seedEvents = async () => {
    try {
        connect()
        console.log('MongoDB Connected');

        // Seed Events
        await db.collection("events").deleteMany({});
        console.log('Old events cleared');

        const eventsToInsert = eventsData.map(ev => {
            const isFlagship = normalizedFlagships.includes(ev.title.toLowerCase()) || 
                               normalizedFlagships.some(nf => ev.title.toLowerCase().includes(nf));
            
            return {
                name: ev.title,
                tagline: ev.tagline,
                category: ev.category,
                type: isFlagship ? 'FLAGSHIP' : 'NORMAL',
                date: ev.date,
                time: ev.time,
                venue: ev.venue,
                eventMode: ev.eventMode,
                description: ev.description,
                image: ev.image,
                posterColor: ev.posterColor,
                gradient: ev.gradient,
                featured: ev.featured,
                seats: ev.seats,
                participants: ev.participants,
                club: ev.club,
                coordinators: ev.eventCoordinators,
                rules: ev.rules
            };
        });

        await db.collection("events").insertMany(eventsToInsert);
        console.log('Events Seeded Successfully');

        // Seed ProShows

    } catch (error) {
        console.error(error);
    }
};

seedEvents();
