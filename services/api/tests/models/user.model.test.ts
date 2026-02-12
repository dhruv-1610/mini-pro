import { User } from '../../src/models/user.model';

/** Factory: returns minimal valid User data. */
function validUserData(): Record<string, unknown> {
  return {
    email: 'jane@example.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUV',
    role: 'user' as const,
    profile: {
      name: 'Jane Doe',
      phone: '+1234567890',
    },
  };
}

describe('User Model — Validation', () => {
  // ── Happy path ──────────────────────────────────────────────────────────
  it('should validate a complete valid user', () => {
    const user = new User(validUserData());
    const err = user.validateSync();
    expect(err).toBeUndefined();
  });

  // ── Required fields ─────────────────────────────────────────────────────
  it('should require email', () => {
    const { email: _, ...data } = validUserData();
    const err = new User(data).validateSync();
    expect(err?.errors.email).toBeDefined();
  });

  it('should require passwordHash', () => {
    const { passwordHash: _, ...data } = validUserData();
    const err = new User(data).validateSync();
    expect(err?.errors.passwordHash).toBeDefined();
  });

  it('should require profile.name', () => {
    const data = { ...validUserData(), profile: { phone: '+1' } };
    const err = new User(data).validateSync();
    expect(err?.errors['profile.name']).toBeDefined();
  });

  // ── Email format ────────────────────────────────────────────────────────
  it('should reject an invalid email format', () => {
    const data = { ...validUserData(), email: 'not-an-email' };
    const err = new User(data).validateSync();
    expect(err?.errors.email).toBeDefined();
  });

  it('should lowercase and trim email', () => {
    const data = { ...validUserData(), email: '  JANE@Example.COM  ' };
    const user = new User(data);
    expect(user.email).toBe('jane@example.com');
  });

  // ── Role enum ───────────────────────────────────────────────────────────
  it('should default role to "public"', () => {
    const { role: _, ...data } = validUserData();
    const user = new User(data);
    expect(user.role).toBe('public');
  });

  it('should accept valid roles: public, user, admin', () => {
    for (const role of ['public', 'user', 'admin'] as const) {
      const user = new User({ ...validUserData(), role });
      expect(user.validateSync()).toBeUndefined();
    }
  });

  it('should reject an invalid role', () => {
    const data = { ...validUserData(), role: 'superadmin' };
    const err = new User(data).validateSync();
    expect(err?.errors.role).toBeDefined();
  });

  // ── Defaults ────────────────────────────────────────────────────────────
  it('should default emailVerified to false', () => {
    const user = new User(validUserData());
    expect(user.emailVerified).toBe(false);
  });

  it('should default stats.volunteerHours to 0', () => {
    const user = new User(validUserData());
    expect(user.stats.volunteerHours).toBe(0);
  });

  it('should default stats.donations to 0', () => {
    const user = new User(validUserData());
    expect(user.stats.donations).toBe(0);
  });

  // ── Constraints ─────────────────────────────────────────────────────────
  it('should reject negative stats.volunteerHours', () => {
    const data = validUserData();
    const user = new User({ ...data, stats: { volunteerHours: -1, donations: 0 } });
    const err = user.validateSync();
    expect(err?.errors['stats.volunteerHours']).toBeDefined();
  });

  it('should reject negative stats.donations', () => {
    const data = validUserData();
    const user = new User({ ...data, stats: { volunteerHours: 0, donations: -5 } });
    const err = user.validateSync();
    expect(err?.errors['stats.donations']).toBeDefined();
  });
});
