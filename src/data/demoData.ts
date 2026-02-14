// Road Runner Auto Sales - Comprehensive Demo Data
// This file contains realistic demo data for the CRM

import type { Vehicle } from '../types/inventory';
import type { Lead } from '../types/lead';
import type { SalesRep } from '../types/salesRep';
import { realisticInventory } from './realisticInventory';

// Demo Sales Reps
export const demoSalesReps: Partial<SalesRep>[] = [
  {
    name: 'Ali Almo',
    email: 'roadrunnerautos2@gmail.com',
    phone: '313-701-2283',
    active_leads_count: 7,
    conversion_rate: 30.4,
    avg_response_time_seconds: 210,
    deals_this_month: 10,
    revenue_this_month: 312000,
    is_active: true,
  },
  {
    name: 'Wayne Sales Desk',
    email: 'roadrunnerautos2@gmail.com',
    phone: '734-415-4489',
    active_leads_count: 8,
    conversion_rate: 29.1,
    avg_response_time_seconds: 190,
    deals_this_month: 12,
    revenue_this_month: 338000,
    is_active: true,
  },
  {
    name: 'Taylor Sales Desk',
    email: 'roadrunnerautos2@gmail.com',
    phone: '734-947-4667',
    active_leads_count: 5,
    conversion_rate: 27.8,
    avg_response_time_seconds: 225,
    deals_this_month: 8,
    revenue_this_month: 244000,
    is_active: true,
  },
];

// Use realistic Michigan inventory from separate file
export const demoInventory: Partial<Vehicle>[] = realisticInventory;

console.log(`✅ Demo data loaded: ${demoInventory.length} vehicles, ${demoSalesReps.length} sales reps`);

// Demo Leads - 25+ Realistic Scenarios
export const demoLeads: Partial<Lead>[] = [
  // HOT LEADS - High urgency, high scores
  {
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '734-555-2001',
    source: 'website_form',
    status: 'new',
    lead_score: 95,
    urgency: 'high',
    vehicle_interest_notes: 'Interested in 2020 Honda Accord. My current car broke down yesterday and I need a reliable vehicle by this weekend. Have $3000 down payment ready.',
    budget_min: 18000,
    budget_max: 23000,
    has_trade_in: false,
    preferred_contact: 'phone'
  },
  {
    first_name: 'Robert',
    last_name: 'Chen',
    email: 'rchen@gmail.com',
    phone: '734-555-2002',
    source: 'phone',
    status: 'contacted',
    lead_score: 88,
    urgency: 'high',
    vehicle_interest_notes: 'Looking to upgrade my truck. Want 2021 Ford F-150 or similar. Need towing capacity for work.',
    budget_min: 28000,
    budget_max: 35000,
    has_trade_in: true,
    trade_in_details: { year: 2018, make: 'Chevrolet', model: 'Silverado', mileage: 75000, estimated_value: 18000 },
    preferred_contact: 'phone'
  },
  {
    first_name: 'Jessica',
    last_name: 'Williams',
    email: 'j.williams@outlook.com',
    phone: '734-555-2003',
    source: 'facebook',
    status: 'interested',
    lead_score: 91,
    urgency: 'high',
    vehicle_interest_notes: 'New job starts next Monday, need car this week! Interested in Honda CR-V or Toyota RAV4.',
    budget_min: 22000,
    budget_max: 27000,
    has_trade_in: false,
    preferred_contact: 'sms'
  },
  
  // MEDIUM URGENCY - Actively shopping
  {
    first_name: 'Michael',
    last_name: 'Davis',
    email: 'mdavis@yahoo.com',
    phone: '734-555-2004',
    source: 'website_form',
    status: 'test_drive',
    lead_score: 78,
    urgency: 'medium',
    vehicle_interest_notes: 'Comparing 2019 Toyota Camry vs 2020 Honda Accord. Want to test drive both. Looking for best fuel economy.',
    budget_min: 18000,
    budget_max: 22000,
    has_trade_in: false,
    preferred_contact: 'email'
  },
  {
    first_name: 'Emily',
    last_name: 'Martinez',
    email: 'emily.m@gmail.com',
    phone: '734-555-2005',
    source: 'website_form',
    status: 'new',
    lead_score: 75,
    urgency: 'medium',
    vehicle_interest_notes: 'First-time buyer, recent college grad. Need reliable sedan under $15k. What financing options do you have?',
    budget_min: 10000,
    budget_max: 15000,
    has_trade_in: false,
    preferred_contact: 'email'
  },
  {
    first_name: 'David',
    last_name: 'Thompson',
    email: 'dthompson@email.com',
    phone: '734-555-2006',
    source: 'phone',
    status: 'negotiating',
    lead_score: 82,
    urgency: 'medium',
    vehicle_interest_notes: 'Interested in 2020 Jeep Grand Cherokee. Can you do better on the price? Shopping around.',
    budget_min: 28000,
    budget_max: 32000,
    has_trade_in: true,
    trade_in_details: { year: 2016, make: 'Jeep', model: 'Cherokee', mileage: 82000, estimated_value: 12000 },
    preferred_contact: 'phone'
  },
  {
    first_name: 'Amanda',
    last_name: 'Rodriguez',
    email: 'a.rodriguez@email.com',
    phone: '734-555-2007',
    source: 'walk_in',
    status: 'interested',
    lead_score: 79,
    urgency: 'medium',
    vehicle_interest_notes: 'Stopped by dealership yesterday. Liked the 2019 Mazda CX-5. Want to bring my husband to see it.',
    budget_min: 25000,
    budget_max: 29000,
    has_trade_in: false,
    preferred_contact: 'phone'
  },
  
  // FAMILY BUYERS
  {
    first_name: 'Jennifer',
    last_name: 'Brown',
    email: 'jbrown@gmail.com',
    phone: '734-555-2008',
    source: 'website_form',
    status: 'test_drive',
    lead_score: 85,
    urgency: 'medium',
    vehicle_interest_notes: 'Need minivan for family of 5. Looking at Honda Odyssey or Toyota Sienna. Safety features important.',
    budget_min: 23000,
    budget_max: 28000,
    has_trade_in: true,
    trade_in_details: { year: 2015, make: 'Honda', model: 'Pilot', mileage: 95000, estimated_value: 14000 },
    preferred_contact: 'email'
  },
  {
    first_name: 'James',
    last_name: 'Wilson',
    email: 'jwilson@outlook.com',
    phone: '734-555-2009',
    source: 'facebook',
    status: 'contacted',
    lead_score: 72,
    urgency: 'medium',
    vehicle_interest_notes: 'Growing family, need SUV with 3rd row. What do you have available in this category?',
    budget_min: 30000,
    budget_max: 38000,
    has_trade_in: false,
    preferred_contact: 'phone'
  },
  
  // LUXURY BUYERS
  {
    first_name: 'William',
    last_name: 'Anderson',
    email: 'w.anderson@email.com',
    phone: '734-555-2010',
    source: 'website_form',
    status: 'new',
    lead_score: 71,
    urgency: 'low',
    vehicle_interest_notes: 'Interested in 2020 BMW 3 Series. Looking for specific features: premium sound, navigation, leather interior.',
    budget_min: 35000,
    budget_max: 42000,
    has_trade_in: false,
    preferred_contact: 'email'
  },
  {
    first_name: 'Michelle',
    last_name: 'Taylor',
    email: 'mtaylor@gmail.com',
    phone: '734-555-2011',
    source: 'phone',
    status: 'interested',
    lead_score: 68,
    urgency: 'low',
    vehicle_interest_notes: 'Want luxury SUV for business. Looking at Lexus RX 350 or Audi Q5. Not in a rush.',
    budget_min: 36000,
    budget_max: 45000,
    has_trade_in: true,
    trade_in_details: { year: 2017, make: 'Mercedes-Benz', model: 'GLC', mileage: 48000, estimated_value: 25000 },
    preferred_contact: 'email'
  },
  
  // ECO-CONSCIOUS BUYERS
  {
    first_name: 'Daniel',
    last_name: 'Garcia',
    email: 'dgarcia@email.com',
    phone: '734-555-2012',
    source: 'website_form',
    status: 'contacted',
    lead_score: 77,
    urgency: 'medium',
    vehicle_interest_notes: 'Looking for hybrid or electric vehicle. Commute 60 miles daily. What are my options?',
    budget_min: 18000,
    budget_max: 24000,
    has_trade_in: false,
    preferred_contact: 'email'
  },
  
  // PRICE SHOPPERS - Lower scores
  {
    first_name: 'Mike',
    last_name: 'Davis',
    email: 'miked@email.com',
    phone: '734-555-2013',
    source: 'email',
    status: 'new',
    lead_score: 62,
    urgency: 'low',
    vehicle_interest_notes: 'Just browsing. Send me your best deals on sedans.',
    budget_min: 15000,
    budget_max: 20000,
    has_trade_in: false,
    preferred_contact: 'email'
  },
  {
    first_name: 'Lisa',
    last_name: 'Moore',
    email: 'lmoore@yahoo.com',
    source: 'website_form',
    status: 'new',
    lead_score: 58,
    urgency: 'low',
    vehicle_interest_notes: 'Comparing prices at 3 dealerships. What is your lowest price on 2019 Camry?',
    budget_min: 17000,
    budget_max: 21000,
    has_trade_in: false,
    preferred_contact: 'email'
  },
  
  // YOUNG BUYERS
  {
    first_name: 'Brandon',
    last_name: 'Lee',
    email: 'blee@gmail.com',
    phone: '734-555-2014',
    source: 'facebook',
    status: 'interested',
    lead_score: 74,
    urgency: 'medium',
    vehicle_interest_notes: 'Just turned 21. Looking for first car. Love the Mustang but open to other sporty options.',
    budget_min: 20000,
    budget_max: 28000,
    has_trade_in: false,
    preferred_contact: 'sms'
  },
  {
    first_name: 'Ashley',
    last_name: 'White',
    email: 'awhite@email.com',
    phone: '734-555-2015',
    source: 'website_form',
    status: 'new',
    lead_score: 69,
    urgency: 'medium',
    vehicle_interest_notes: 'Recent grad, new job. Need reliable car for commute. Parents helping with down payment.',
    budget_min: 12000,
    budget_max: 16000,
    has_trade_in: false,
    preferred_contact: 'phone'
  },
  
  // WORK/COMMERCIAL
  {
    first_name: 'Thomas',
    last_name: 'Jackson',
    email: 'tj@contractorpro.com',
    phone: '734-555-2016',
    source: 'phone',
    status: 'negotiating',
    lead_score: 86,
    urgency: 'high',
    vehicle_interest_notes: 'Contractor needing work truck ASAP. F-150 or Silverado. Need crew cab and towing package.',
    budget_min: 28000,
    budget_max: 36000,
    has_trade_in: true,
    trade_in_details: { year: 2016, make: 'Ford', model: 'F-150', mileage: 105000, estimated_value: 15000 },
    preferred_contact: 'phone'
  },
  
  // RECENT LEADS (created in last 2 hours)
  {
    first_name: 'Karen',
    last_name: 'Phillips',
    email: 'kphillips@email.com',
    phone: '734-555-2017',
    source: 'website_form',
    status: 'new',
    lead_score: 81,
    urgency: 'high',
    vehicle_interest_notes: 'Saw your 2020 CR-V online. Is it still available? Can I come see it today?',
    budget_min: 23000,
    budget_max: 27000,
    has_trade_in: false,
    preferred_contact: 'phone'
  },
  {
    first_name: 'Kevin',
    last_name: 'Martin',
    email: 'kmartin@gmail.com',
    phone: '734-555-2018',
    source: 'phone',
    status: 'new',
    lead_score: 87,
    urgency: 'high',
    vehicle_interest_notes: 'Just called about Ram 1500. Loved it. Want to schedule test drive tomorrow if possible.',
    budget_min: 32000,
    budget_max: 36000,
    has_trade_in: false,
    preferred_contact: 'sms'
  },
  
  // WON DEALS (Closed)
  {
    first_name: 'Steven',
    last_name: 'Harris',
    email: 'sharris@email.com',
    phone: '734-555-2019',
    source: 'walk_in',
    status: 'closed_won',
    lead_score: 92,
    urgency: 'high',
    closed_status: 'won',
    deal_value: 21995,
    vehicle_interest_notes: 'Purchased 2020 Honda Accord last week. Very happy with service!',
    budget_min: 20000,
    budget_max: 24000,
    has_trade_in: true,
    trade_in_details: { year: 2015, make: 'Honda', model: 'Civic', mileage: 88000, estimated_value: 8000 }
  },
  {
    first_name: 'Rachel',
    last_name: 'Clark',
    email: 'rclark@email.com',
    phone: '734-555-2020',
    source: 'website_form',
    status: 'closed_won',
    lead_score: 89,
    urgency: 'medium',
    closed_status: 'won',
    deal_value: 19995,
    vehicle_interest_notes: 'Bought 2019 Toyota Camry. Great financing deal!',
    budget_min: 18000,
    budget_max: 21000,
    has_trade_in: false
  },
  
  // LOST DEALS
  {
    first_name: 'Patrick',
    last_name: 'Lewis',
    email: 'plewis@email.com',
    phone: '734-555-2021',
    source: 'phone',
    status: 'closed_lost',
    lead_score: 65,
    urgency: 'medium',
    closed_status: 'lost',
    lost_reason: 'Bought from competitor - better price',
    vehicle_interest_notes: 'Was interested in Mazda6 but found cheaper elsewhere.',
    budget_min: 19000,
    budget_max: 22000
  },
  {
    first_name: 'Nancy',
    last_name: 'Walker',
    email: 'nwalker@email.com',
    phone: '734-555-2022',
    source: 'website_form',
    status: 'closed_lost',
    lead_score: 71,
    urgency: 'medium',
    closed_status: 'lost',
    lost_reason: 'Financing denied',
    vehicle_interest_notes: 'Wanted Explorer but could not get approved for loan.',
    budget_min: 30000,
    budget_max: 35000
  },
  
  // ADDITIONAL ACTIVE LEADS
  {
    first_name: 'Christopher',
    last_name: 'Young',
    email: 'cyoung@email.com',
    phone: '734-555-2023',
    source: 'facebook',
    status: 'contacted',
    lead_score: 76,
    urgency: 'medium',
    vehicle_interest_notes: 'Interested in truck for hauling. F-150 vs Silverado comparison?',
    budget_min: 27000,
    budget_max: 32000,
    has_trade_in: false
  },
  {
    first_name: 'Laura',
    last_name: 'King',
    email: 'lking@email.com',
    phone: '734-555-2024',
    source: 'website_form',
    status: 'financing_review',
    lead_score: 80,
    urgency: 'medium',
    vehicle_interest_notes: 'Applied for financing on Highlander. Waiting for approval.',
    budget_min: 29000,
    budget_max: 33000,
    has_trade_in: true,
    trade_in_details: { year: 2014, make: 'Toyota', model: 'RAV4', mileage: 92000, estimated_value: 11000 }
  },
  {
    first_name: 'Ryan',
    last_name: 'Scott',
    email: 'rscott@gmail.com',
    phone: '734-555-2025',
    source: 'walk_in',
    status: 'test_drive',
    lead_score: 83,
    urgency: 'medium',
    vehicle_interest_notes: 'Test drove Mazda CX-5 yesterday. Loved it! Need to discuss numbers.',
    budget_min: 26000,
    budget_max: 30000,
    has_trade_in: false
  }
];

console.log(`✅ Demo leads created: ${demoLeads.length} realistic scenarios`);
