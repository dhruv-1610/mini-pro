/**
 * Seed one verified report and one drive for testing the donate/payment flow.
 *
 * Usage (from services/api):
 *   npx ts-node -P tsconfig.json src/scripts/seed-test-drive.ts
 *   npm run seed:test-drive
 *
 * Requires: at least one user in the database (any role). Uses the first user as createdBy.
 * Creates: 1 Report (verified), 1 Drive (planned) linked to it.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { Report } from '../models/report.model';
import { Drive } from '../models/drive.model';
import { env } from '../config/env';

const MONGO_URI = process.env.MONGO_URI || env.MONGO_URI;

async function seed(): Promise<void> {
  await mongoose.connect(MONGO_URI);

  const user = await User.findOne();
  if (!user) {
    console.error('No user found. Register at least one user, then run this script again.');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Find a verified report that doesn't have a drive yet, or create one
  const reports = await Report.find({ status: 'verified' }).lean();
  let reportId: mongoose.Types.ObjectId;
  let location: { type: 'Point'; coordinates: [number, number] };
  let report: { _id: mongoose.Types.ObjectId; location: { type: 'Point'; coordinates: [number, number] } } | null = null;
  for (const r of reports) {
    const hasDrive = await Drive.exists({ reportId: r._id });
    if (!hasDrive) {
      report = { _id: r._id as mongoose.Types.ObjectId, location: r.location as { type: 'Point'; coordinates: [number, number] } };
      break;
    }
  }

  if (report) {
    reportId = report._id;
    location = report.location;
    console.log('Using verified report (no drive yet):', reportId.toString());
  } else {
    const newReport = await Report.create({
      photoUrls: ['/uploads/placeholder-test.png'],
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716], // Bangalore
      },
      description: 'Test report for donation drive',
      severity: 'medium',
      status: 'verified',
      createdBy: user._id,
    });
    reportId = newReport._id as mongoose.Types.ObjectId;
    location = newReport.location as { type: 'Point'; coordinates: [number, number] };
    console.log('Created verified report:', reportId.toString());
  }

  const existingDrive = await Drive.findOne({ reportId });
  if (existingDrive) {
    console.log('Drive already exists for this report. Drive id:', existingDrive._id.toString());
    console.log('Use this drive id to test donate:', existingDrive._id.toString());
    await mongoose.disconnect();
    return;
  }

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);

  const drive = await Drive.create({
    title: 'Test Donation Drive',
    location,
    date: futureDate,
    maxVolunteers: 10,
    fundingGoal: 50000, // 500 INR in paise
    fundingRaised: 0,
    requiredRoles: [
      { role: 'Cleaner', capacity: 8, booked: 0, waitlist: 0 },
      { role: 'Coordinator', capacity: 2, booked: 0, waitlist: 0 },
    ],
    status: 'planned',
    reportId,
  });

  console.log('Created test drive for donations. Drive id:', drive._id.toString());
  console.log('Use this id on the Donate page or: POST /api/drives/' + drive._id + '/donate');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
