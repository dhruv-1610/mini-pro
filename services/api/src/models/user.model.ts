import { Schema, model, Document } from 'mongoose';

// ── Constants ──────────────────────────────────────────────────────────────
/** Platform-level user roles. */
export const USER_ROLES = ['public', 'user', 'organizer', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// ── Interface ──────────────────────────────────────────────────────────────
export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  /** True when admin has approved organizer account. Only relevant when role = organizer. */
  organizerApproved: boolean;
  profile: {
    name: string;
    phone?: string;
    avatar?: string;
  };
  stats: {
    volunteerHours: number;
    donations: number;
  };
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ─────────────────────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES as unknown as string[],
        message: 'Role must be public, user, organizer, or admin',
      },
      default: 'public',
      required: true,
    },
    organizerApproved: {
      type: Boolean,
      default: false,
    },
    profile: {
      name: {
        type: String,
        required: [true, 'Profile name is required'],
        trim: true,
      },
      phone: { type: String, trim: true },
      avatar: { type: String },
    },
    stats: {
      volunteerHours: { type: Number, default: 0, min: [0, 'Volunteer hours cannot be negative'] },
      donations: { type: Number, default: 0, min: [0, 'Donations count cannot be negative'] },
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ organizerApproved: 1 });

// ── Model ──────────────────────────────────────────────────────────────────
export const User = model<IUser>('User', userSchema);
