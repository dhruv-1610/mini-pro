import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { User } from '../models/user.model';
import { Attendance } from '../models/attendance.model';
import { NotFoundError } from '../utils/errors';
import { getUserBadges } from './badge.service';

/**
 * Generate PDF certificate for a user.
 * User must have at least 1 completed drive (checked_in attendance).
 */
export async function generateCertificate(userId: string): Promise<Buffer> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const user = await User.findById(userObjectId).lean();
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const driveCount = await Attendance.countDocuments({
    userId: userObjectId,
    status: 'checked_in',
  });

  if (driveCount < 1) {
    throw new NotFoundError('User must have at least 1 completed drive to generate certificate');
  }

  const volunteerHours = user.stats?.volunteerHours ?? 0;
  const badges = await getUserBadges(userId);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(24).text('CLEANUPCREW', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('Certificate of Appreciation', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).text(`This certifies that ${user.profile?.name ?? 'Unknown'} has contributed to community cleanup through CLEANUPCREW.`);
    doc.moveDown(2);

    doc.fontSize(12);
    doc.text(`Total Drives Attended: ${driveCount}`);
    doc.text(`Total Volunteer Hours: ${volunteerHours}`);
    doc.text(`Current Badge Level: ${badges.volunteerBadge}`);
    doc.moveDown(2);

    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });

    doc.end();
  });
}
