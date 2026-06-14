import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;
console.log('Connecting to:', MONGO_URI ? MONGO_URI.replace(/:([^@]+)@/, ':****@') : 'undefined');

if (!MONGO_URI) {
  console.error('MONGO_URI is not defined in server/.env');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Successfully connected to MongoDB Atlas!');
    
    // Check Users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('\n--- Active Users in Database ---');
    console.log(`Count: ${users.length}`);
    users.forEach(u => {
      console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Status: ${u.status}`);
    });
    
    // Check Incidents
    const incidents = await mongoose.connection.db.collection('incidents').find({}).toArray();
    console.log('\n--- Emergency Incidents ---');
    console.log(`Count: ${incidents.length}`);
    incidents.forEach(i => {
      console.log(`- ID: ${i._id}, Status: ${i.status}, Urgency: ${i.urgency}, Damage: ${i.damageLevel}`);
      console.log(`  Desc: ${i.description}`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
