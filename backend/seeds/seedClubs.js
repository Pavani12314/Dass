const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Organizer = require('../models/Organizer');

// IIIT Clubs data
const clubs = [
  {
    firstName: '0x1337',
    lastName: 'Hacking Club',
    email: 'hacking@felicity.iiit.ac.in',
    password: 'club123',
    category: 'technical',
    description: 'IIIT\'s premier cybersecurity and ethical hacking club. We explore vulnerabilities, CTF competitions, and security research.'
  },
  {
    firstName: 'Astronautics',
    lastName: 'Club',
    email: 'astronautics@felicity.iiit.ac.in',
    password: 'club123',
    category: 'technical',
    description: 'Exploring the cosmos through astronomy, astrophysics, and space technology. Stargazing events, telescope sessions, and space research projects.'
  },
  {
    firstName: 'Developer Student',
    lastName: 'Club (DSC)',
    email: 'dsc@felicity.iiit.ac.in',
    password: 'club123',
    category: 'technical',
    description: 'Google-powered community for student developers. Workshops, hackathons, and building solutions for local problems.'
  },
  {
    firstName: 'Electronics & Robotics',
    lastName: 'Club (ERC)',
    email: 'erc@felicity.iiit.ac.in',
    password: 'club123',
    category: 'technical',
    description: 'Building the future with circuits, robots, and embedded systems. Hardware projects, drone building, and robotics competitions.'
  },
  {
    firstName: 'ISAQC',
    lastName: 'Quantum Computing',
    email: 'isaqc@felicity.iiit.ac.in',
    password: 'club123',
    category: 'technical',
    description: 'Pioneering quantum computing education and research at IIIT. Quantum algorithms, Qiskit workshops, and quantum machine learning.'
  }
];

const seedClubs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    console.log('\n🎉 Seeding IIIT Clubs...\n');

    for (const clubData of clubs) {
      // Check if club already exists
      const existingClub = await User.findOne({ email: clubData.email });
      
      const fullName = `${clubData.firstName} ${clubData.lastName}`;

      if (existingClub) {
        // Check if Organizer record exists
        const existingOrganizer = await Organizer.findOne({ userId: existingClub._id });
        
        if (!existingOrganizer) {
          // Create Organizer record for existing User
          await Organizer.create({
            name: fullName,
            category: clubData.category,
            description: clubData.description,
            contactEmail: clubData.email,
            userId: existingClub._id,
            isActive: true
          });
          console.log(`✅ Created Organizer record for existing user: ${fullName}`);
        } else {
          console.log(`⏭️  Club already exists: ${fullName}`);
        }
        continue;
      }

      // Create User (organizer role)
      const user = await User.create({
        firstName: clubData.firstName,
        lastName: clubData.lastName,
        email: clubData.email,
        password: clubData.password,
        role: 'organizer',
        isActive: true,
        onboardingCompleted: true
      });

      // Create Organizer record linked to User
      await Organizer.create({
        name: fullName,
        category: clubData.category,
        description: clubData.description,
        contactEmail: clubData.email,
        userId: user._id,
        isActive: true
      });

      console.log(`✅ Created: ${fullName}`);
      console.log(`   Email: ${clubData.email}`);
      console.log(`   Password: ${clubData.password}\n`);
    }

    console.log('\n🎊 All clubs seeded successfully!');
    console.log('\n📋 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    clubs.forEach(club => {
      console.log(`   ${club.firstName} ${club.lastName}`);
      console.log(`   → ${club.email} / ${club.password}`);
      console.log('');
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  Please change the default passwords after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding clubs:', error);
    process.exit(1);
  }
};

seedClubs();
