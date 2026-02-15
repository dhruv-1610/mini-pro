import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { PrimaryButton, SecondaryButton, Modal } from '../components/ui';
import { useIsAuthenticated } from '../stores/authStore';
import { api } from '../lib/api';

const STEPS = ['Photo', 'Location', 'Details'] as const;
const SEVERITIES = ['low', 'medium', 'high'] as const;
const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];
const DEFAULT_ZOOM = 13;

function PhotoStep({
  file,
  preview,
  error,
  onSelect,
  onClear,
  isDragging,
  onDragChange,
}: {
  file: File | null;
  preview: string | null;
  error: string | null;
  onSelect: (f: File) => void;
  onClear: () => void;
  isDragging: boolean;
  onDragChange: (v: boolean) => void;
}): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) {
      onClear();
      return;
    }
    const types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!types.includes(f.type) || f.size > 5 * 1024 * 1024) {
      onSelect(f);
      return;
    }
    onSelect(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    onDragChange(false);
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) handleFile(f);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-stone-900">Upload a photo</h3>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          onDragChange(true);
        }}
        onDragLeave={() => onDragChange(false)}
        onDrop={handleDrop}
        className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-stone-100'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleChange}
        />
        {file && preview ? (
          <div className="relative p-4">
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute right-6 top-6 rounded-full bg-stone-900/70 p-1.5 text-white hover:bg-stone-900"
              aria-label="Remove photo"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <svg
              className="h-12 w-12 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-stone-500">Drag & drop or click to upload</p>
          </>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}

function LocationStep({
  lat,
  lng,
  error,
  onSelect,
}: {
  lat: number | null;
  lng: number | null;
  error: string | null;
  onSelect: (lat: number, lng: number) => void;
}): React.ReactElement {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      if (markerRef.current) markerRef.current.setLatLng([newLat, newLng]);
      else {
        const icon = L.divIcon({
          className: 'location-picker-marker',
          html: '<div style="width:24px;height:24px;background:#15803d;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        markerRef.current = L.marker([newLat, newLng], { icon }).addTo(map);
      }
      onSelect(newLat, newLng);
    };
    map.on('click', handleClick);
    mapInstanceRef.current = map;
    return () => {
      map.off('click', handleClick);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [onSelect]);

  useEffect(() => {
    if (lat != null && lng != null && mapInstanceRef.current) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          className: 'location-picker-marker',
          html: '<div style="width:24px;height:24px;background:#15803d;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        markerRef.current = L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.setView([lat, lng], 15);
    }
  }, [lat, lng]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-stone-900">Pick location on map</h3>
      <p className="text-sm text-stone-600">Click on the map to set the report location.</p>
      <div
        ref={mapRef}
        className="h-64 w-full overflow-hidden rounded-2xl border border-stone-200"
      />
      {(lat != null && lng != null) && (
        <p className="text-sm text-stone-500">
          Selected: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}

function DetailsStep({
  severity,
  description,
  errors,
  onChange,
}: {
  severity: string;
  description: string;
  errors: { severity?: string; description?: string };
  onChange: (field: 'severity' | 'description', value: string) => void;
}): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-stone-900">Details</h3>

      <div>
        <label htmlFor="severity" className="block text-sm font-medium text-stone-700">
          Severity
        </label>
        <select
          id="severity"
          value={severity}
          onChange={(e) => onChange('severity', e.target.value)}
          className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.severity ? 'border-red-300' : 'border-stone-200'
          }`}
          aria-invalid={!!errors.severity}
          aria-describedby={errors.severity ? 'severity-error' : undefined}
        >
          <option value="">Select severity</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        {errors.severity && (
          <p id="severity-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.severity}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-stone-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => onChange('description', e.target.value)}
          rows={4}
          placeholder="Describe the issue..."
          className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.description ? 'border-red-300' : 'border-stone-200'
          }`}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <p id="description-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function ReportSubmissionPage(): React.ReactElement {
  const navigate = useNavigate();
  const isAuth = useIsAuthenticated();

  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  const validateStep = useCallback(
    (s: number) => {
      if (s === 0) {
        if (!file) {
          setFieldErrors({ photo: 'Photo is required' });
          return false;
        }
        const types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!types.includes(file.type)) {
          setFieldErrors({ photo: 'Only JPEG, PNG, GIF, WebP allowed' });
          return false;
        }
        setFieldErrors({});
        return true;
      }
      if (s === 1) {
        if (lat == null || lng == null) {
          setFieldErrors({ location: 'Please select a location on the map' });
          return false;
        }
        setFieldErrors({});
        return true;
      }
      if (s === 2) {
        const errs: Record<string, string> = {};
        if (!severity || !SEVERITIES.includes(severity as (typeof SEVERITIES)[number])) {
          errs.severity = 'Please select a severity';
        }
        if (!description.trim()) {
          errs.description = 'Description is required';
        }
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
      }
      return true;
    },
    [file, lat, lng, severity, description]
  );

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    setFieldErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;
    if (!file || lat == null || lng == null) return;
    if (!isAuth) {
      setSubmitError('Please log in to submit a report');
      return;
    }

    setLoading(true);
    setSubmitError(null);
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('lat', String(lat));
    formData.append('lng', String(lng));
    formData.append('severity', severity);
    formData.append('description', description.trim());

    try {
      await api.post('/api/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessOpen(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Failed to submit report';
      setSubmitError(typeof msg === 'string' ? msg : 'Failed to submit report');
      if (err && typeof err === 'object' && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 401) {
          setSubmitError('Please log in to submit a report');
          navigate('/login?redirect=/reports/new');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-8"
          >
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Report a spot
            </h1>
            <p className="mt-1 text-stone-600">
              Help keep our streets clean by reporting litter or illegal dumping.
            </p>

            {!isAuth && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <Link to="/login?redirect=/reports/new" className="font-medium underline">
                  Log in
                </Link>
                {' to submit a report.'}
              </div>
            )}

            {/* Step indicator */}
            <div className="mt-8 flex gap-2">
              {STEPS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    i <= step ? 'bg-primary-600' : 'bg-stone-200'
                  } ${i < step ? 'cursor-pointer hover:bg-primary-700' : ''}`}
                  aria-label={`Step ${i + 1}: ${label}`}
                  aria-current={i === step ? 'step' : undefined}
                />
              ))}
            </div>

            <div className="mt-8 min-h-[280px]">
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <PhotoStep
                    key="photo"
                    file={file}
                    preview={preview}
                    error={fieldErrors.photo}
                    onSelect={setFile}
                    onClear={() => setFile(null)}
                    isDragging={isDragging}
                    onDragChange={setIsDragging}
                  />
                )}
                {step === 1 && (
                  <LocationStep
                    key="location"
                    lat={lat}
                    lng={lng}
                    error={fieldErrors.location}
                    onSelect={(la, ln) => {
                      setLat(la);
                      setLng(ln);
                    }}
                  />
                )}
                {step === 2 && (
                  <DetailsStep
                    key="details"
                    severity={severity}
                    description={description}
                    errors={{ severity: fieldErrors.severity, description: fieldErrors.description }}
                    onChange={(field, value) => {
                      if (field === 'severity') setSeverity(value);
                      else setDescription(value);
                    }}
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 flex justify-between gap-4">
              <SecondaryButton
                onClick={handleBack}
                disabled={step === 0}
                className="min-w-[100px]"
              >
                Back
              </SecondaryButton>
              {step < STEPS.length - 1 ? (
                <PrimaryButton onClick={handleNext} className="min-w-[100px]">
                  Next
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  onClick={handleSubmit}
                  isLoading={loading}
                  disabled={!isAuth}
                  className="min-w-[100px]"
                >
                  Submit
                </PrimaryButton>
              )}
            </div>

            {submitError && (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {submitError}
              </p>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />

      <Modal
        isOpen={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          navigate('/');
        }}
        closeOnOverlayClick={true}
      >
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-7 w-7 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-stone-900">Report submitted!</h2>
          <p className="mt-2 text-sm text-stone-600">
            Thank you for helping keep our community clean.
          </p>
          <PrimaryButton
            onClick={() => {
              setSuccessOpen(false);
              navigate('/');
            }}
            className="mt-6"
          >
            Back to home
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
