require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const connectDB = require('../config/db');

const checkEventOrganizer = async () => {
  try {
    await connectDB();

    const eventId = '6996fedeff71f7cc1f3d335e'; // Haunted House event ID
    const event = await Event.findById(eventId).populate('organizer', 'email organizerName role');
    
    if (!event) {
      console.log('Event not found');
      process.exit(1);
    }

    console.log('\n=== EVENT DETAILS ===');
    console.log(`Event Name: ${event.eventName}`);
    console.log(`Event ID: ${event._id}`);
    console.log(`Organizer ID: ${event.organizer}`);
    console.log(`Organizer Email: ${event.organizer?.email || 'N/A'}`);
    console.log(`Organizer Name: ${event.organizer?.organizerName || 'N/A'}`);
    console.log(`Organizer Role: ${event.organizer?.role || 'N/A'}`);

    // Get all organizers
    console.log('\n=== ALL ORGANIZERS ===');
    const organizers = await User.find({ role: 'organizer' }).select('email organizerName');
    organizers.forEach(org => {
      console.log(`- ${org.organizerName || 'N/A'} (${org.email}) - ID: ${org._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkEventOrganizer();
