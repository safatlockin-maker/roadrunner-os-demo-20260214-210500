export const websiteIntelligence = {
  snapshotDate: '2026-02-14',
  sourceDomains: ['roadrunnerautosmi.com', 'roadrunnerauto.co'],

  inventoryHighlights: {
    wayne: {
      listingCountObserved: 220,
      note: 'Wayne site shows strong SUV/sedan concentration with broad model-year spread.',
      topBodyStyles: [
        { bodyStyle: 'SUV', count: 96 },
        { bodyStyle: 'Sedan', count: 76 },
        { bodyStyle: 'Truck', count: 25 },
      ],
      topMakes: [
        { make: 'Chevrolet', count: 24 },
        { make: 'Ford', count: 24 },
        { make: 'Nissan', count: 24 },
        { make: 'Honda', count: 21 },
        { make: 'Toyota', count: 15 },
      ],
    },
    taylor: {
      listingCountObserved: 250,
      note: 'Taylor site has very strong SUV + sedan inventory and active specials pages.',
      topBodyStyles: [
        { bodyStyle: 'SUV', count: 111 },
        { bodyStyle: 'Sedan', count: 89 },
        { bodyStyle: 'Truck', count: 23 },
      ],
      topMakes: [
        { make: 'Chevrolet', count: 29 },
        { make: 'Ford', count: 26 },
        { make: 'Nissan', count: 26 },
        { make: 'Honda', count: 22 },
        { make: 'Kia', count: 19 },
      ],
    },
  },

  leadIntakeSignals: {
    formsInPublicFlow: ['Contact us', 'Schedule appointment', 'Apply for financing'],
    capturedFields: [
      'first_name',
      'last_name',
      'email',
      'phone',
      'preferred_contact_time',
      'vehicle_interest',
      'message',
      'appointment_datetime',
      'consent_sms_phone',
    ],
    consentLanguageObserved: true,
    financeMessaging: ['all credit scores accepted', 'second chance financing', 'bankruptcy-friendly messaging'],
  },

  demoStorylineAnchors: [
    'Speed-to-lead matters because high-intent finance + appointment forms are visible and active.',
    'Two-location routing is essential because Wayne and Taylor both run independent contact flows.',
    'SUV/sedan-heavy inventory means match-and-alternative workflows should prioritize those segments.',
    'Missed-call text-back and compliance-safe consent logging are high-leverage in this business model.',
  ],
};
