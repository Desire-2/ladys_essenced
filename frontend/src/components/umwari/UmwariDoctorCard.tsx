import React, { useState } from 'react';
import { Stethoscope, Calendar, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { createAppointment, getApiErrorMessage } from '../../lib/appointmentsApi';
import toast from 'react-hot-toast';

interface DoctorRecommendationProps {
  providerId: number;
  name: string;
  specialization: string;
  clinic: string;
  reason: string;
  urgency: 'routine' | 'soon' | 'urgent';
}

export const UmwariDoctorCard: React.FC<DoctorRecommendationProps> = ({
  providerId,
  name,
  specialization,
  clinic,
  reason,
  urgency,
}) => {
  const { user } = useAuthStore();
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00');
  const [isBooking, setIsBooking] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Set default date (tomorrow)
  React.useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setBookingDate(`${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`);
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate || !bookingTime) {
      toast.error('Please select both date and time.');
      return;
    }

    setIsBooking(true);
    try {
      const scheduledDatetime = new Date(`${bookingDate}T${bookingTime}`).toISOString();
      
      if (user?.user_type === 'parent') {
        toast.error('Open Parent Dashboard, select your child, then book an appointment there.');
        return;
      }

      const notes = `Umwari recommendation with ${name} (${specialization} at ${clinic}). ${reason}`;

      await createAppointment({
        appointment_type: 'consultation',
        scheduled_datetime: scheduledDatetime,
        notes,
        provider_id: providerId,
      });

      setIsBooked(true);
      toast.success(`Success! Appointment requested with ${name}`);
    } catch (err) {
      console.error('Umwari booking integration error:', err);
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsBooking(false);
    }
  };

  const urgencyColors = {
    routine: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    soon: 'bg-amber-50 text-amber-700 border-amber-200/50',
    urgent: 'bg-rose-50 text-rose-700 border-rose-200/50',
  };

  const urgencyLabels = {
    routine: 'Routine • Bisanzwe',
    soon: 'Soon • Vuba aha',
    urgent: 'Urgent • Byihuse',
  };

  return (
    <div className="p-4 rounded-2xl border border-[#7A4F6D]/15 bg-white shadow-md space-y-3.5 mt-2 transition-all hover:shadow-lg" id={`doctor-recommend-card-${providerId}`}>
      
      {/* Header section with badge */}
      <div className="flex justify-between items-start gap-2 border-b border-[#7A4F6D]/5 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#7A4F6D]/10 flex items-center justify-center text-[#7A4F6D]">
            <Stethoscope className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-[13px] font-black tracking-tight text-ink">{name}</h4>
            <p className="text-[10px] text-muted font-bold leading-none">{specialization}</p>
          </div>
        </div>
        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${urgencyColors[urgency] || urgencyColors.routine}`}>
          {urgencyLabels[urgency] || urgencyLabels.routine}
        </span>
      </div>

      {/* Specialty and rationale details */}
      <div className="space-y-1 bg-[#FAF9F6] p-2.5 rounded-xl border border-border/10">
        <span className="text-[9px] uppercase font-bold text-muted tracking-wider block">Recommended Clinic / Centre</span>
        <span className="text-[11px] font-bold text-ink block">{clinic}</span>
        
        <p className="text-[11px] text-muted leading-relaxed font-semibold italic mt-1.5 pt-1.5 border-t border-border/10">
          &ldquo;{reason}&rdquo;
        </p>
      </div>

      {/* Booking interactions */}
      {!isBooked ? (
        <div className="space-y-2">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              type="button"
              className="w-full h-9 flex items-center justify-center gap-2 bg-[#7A4F6D] hover:bg-[#68415C] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Appointment • Sura Muganga</span>
            </button>
          ) : (
            <form onSubmit={handleBook} className="space-y-3 pt-2 border-t border-[#7A4F6D]/10 animate-fade-in">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted uppercase block">Select Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      required
                      className="w-full text-[11px] p-2 rounded-lg border border-border bg-white focus:outline-none focus:border-[#7A4F6D]"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted uppercase block">Time</label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    required
                    className="w-full text-[11px] p-2 rounded-lg border border-border bg-white focus:outline-none focus:border-[#7A4F6D]"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={isBooking}
                  className="px-2.5 bg-border/20 hover:bg-border/40 text-muted rounded-xl text-xs font-bold transition-all shrink-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBooking}
                  className="flex-1 h-9 bg-gradient-to-r from-[#7A4F6D] to-[#C4785A] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Booking...</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Confirm Booking</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Success! Your request has been confirmed.</span>
        </div>
      )}
    </div>
  );
};
export default UmwariDoctorCard;
