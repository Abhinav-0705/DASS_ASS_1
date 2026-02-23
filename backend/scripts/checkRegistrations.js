require('dotenv').config();
const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User'); // Add User model
const connectDB = require('../config/db');

const checkRegistrations = async () => {
  try {
    await connectDB();

    // Get all events
    const events = await Event.find().select('eventName organizer');
    console.log('\n=== EVENTS ===');
    console.log(`Total events: ${events.length}`);
    events.forEach(event => {
      console.log(`- ${event.eventName} (ID: ${event._id})`);
    });

    // Get all registrations
    const registrations = await Registration.find()
      .populate('eventId', 'eventName')
      .populate('participantId', 'firstName lastName email');
    
    console.log('\n=== REGISTRATIONS ===');
    console.log(`Total registrations: ${registrations.length}`);
    
    if (registrations.length === 0) {
      console.log('No registrations found in the database.');
    } else {
      registrations.forEach(reg => {
        console.log(`\n- Registration ID: ${reg._id}`);
        console.log(`  Event: ${reg.eventId?.eventName || 'N/A'} (ID: ${reg.eventId?._id || 'N/A'})`);
        console.log(`  Participant: ${reg.participantId?.firstName} ${reg.participantId?.lastName}`);
        console.log(`  Email: ${reg.participantId?.email}`);
        console.log(`  Status: ${reg.status}`);
        console.log(`  Created: ${reg.createdAt}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking registrations:', error);
    process.exit(1);
  }
};

checkRegistrations();
