// Road Runner Auto Sales - verified dealership information.
// Source: roadrunnerautosmi.com (Wayne) and roadrunnerauto.co (Taylor), refreshed Feb 14, 2026.
export const dealershipInfo = {
  name: 'Road Runner Auto Sales',
  type: 'Family-oriented used car dealership with in-house financing',

  websites: {
    wayne: 'https://www.roadrunnerautosmi.com',
    taylor: 'https://www.roadrunnerauto.co',
    inventory: 'https://www.roadrunnerauto.co/cars-for-sale',
    specials: 'https://www.roadrunnerauto.co/specials',
  },

  locations: [
    {
      name: 'Wayne Location',
      address: '31731 Michigan Avenue, Wayne, MI 48184',
      phone: '(734) 415-4489',
      alternate_phones: ['(734) 895-8533'],
      hours: {
        monday: '9:00 AM - 7:00 PM',
        tuesday: '9:00 AM - 7:00 PM',
        wednesday: '9:00 AM - 7:00 PM',
        thursday: '9:00 AM - 7:00 PM',
        friday: '9:00 AM - 7:00 PM',
        saturday: '9:00 AM - 5:00 PM',
        sunday: 'Closed',
      },
    },
    {
      name: 'Taylor Location',
      address: '24560 Eureka Rd, Taylor, MI 48180',
      phone: '(734) 947-4667',
      hours: {
        monday: '9:00 AM - 7:00 PM',
        tuesday: '9:00 AM - 7:00 PM',
        wednesday: '9:00 AM - 7:00 PM',
        thursday: '9:00 AM - 7:00 PM',
        friday: '9:00 AM - 7:00 PM',
        saturday: '9:00 AM - 5:00 PM',
        sunday: 'Closed',
      },
    },
  ],

  services: [
    'Used vehicle sales',
    'Buy Here Pay Here / In-house financing',
    'Online financing application and pre-approval',
    'Trade-in evaluations',
    'We buy vehicles (cash offer path)',
    'Vehicle request / car finder support',
    'Test drive appointments',
    'Video walkarounds',
    'Virtual financing',
    'Virtual showroom browsing',
  ],

  specialties: [
    'SUVs',
    'Sedans',
    'Pickup Trucks',
    'Luxury Vehicles',
    'Coupes',
    'Convertibles',
  ],

  currentPromotions: [
    'Get approved online before visiting the lot',
    'Get a quote before selling or trading your vehicle',
    'Schedule a test drive at Wayne or Taylor location',
    'Specials inventory rotates frequently on the Taylor site',
  ],

  features: [
    'Hassle-free shopping and buying experience',
    'Wide used inventory with photos and vehicle detail pages',
    'Family-oriented local dealership support',
    'Two Metro Detroit locations for convenience',
    'Strong SUV/sedan/truck inventory depth',
    'TCPA-style explicit consent language on contact/appointment/finance forms',
  ],

  publicContacts: {
    main_phone: '(734) 895-8533',
    wayne_phone: '(734) 415-4489',
    taylor_phone: '(734) 947-4667',
    sales_email: 'roadrunnerautos2@gmail.com',
  },
};

export const salesTeam = [
  {
    name: 'Ali Almo',
    role: 'Sales',
    phone: '(313) 701-2283',
    email: 'roadrunnerautos2@gmail.com',
    specialties: ['Sales', 'Customer Appointments', 'Inventory Support'],
  },
  {
    name: 'Wayne Sales Desk',
    role: 'Sales Team',
    phone: '(734) 415-4489',
    email: 'roadrunnerautos2@gmail.com',
    specialties: ['Used Vehicles', 'Trade-ins', 'Financing Intake'],
  },
  {
    name: 'Taylor Sales Desk',
    role: 'Sales Team',
    phone: '(734) 947-4667',
    email: 'roadrunnerautos2@gmail.com',
    specialties: ['Used Vehicles', 'Trade-ins', 'Financing Intake'],
  },
];
