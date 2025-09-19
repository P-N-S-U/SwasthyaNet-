
import data from '@/lib/placeholder-images.json';

const { placeholderImages } = data;

const findImage = (id: string) => placeholderImages.find(img => img.id === id);

export const testimonials = [
  {
    name: 'Sarah L.',
    role: 'Patient',
    testimonial:
      'SwasthyaNet made it so easy to find a specialist and get a consultation without leaving my home. The AI symptom checker was surprisingly accurate!',
    image: findImage('testimonial-1'),
    avatarFallback: 'SL',
  },
  {
    name: 'Dr. Mark R.',
    role: 'Cardiologist',
    testimonial:
      'As a doctor, this platform has streamlined my workflow. I can manage appointments, consult with patients, and issue prescriptions all in one place.',
    image: findImage('testimonial-2'),
    avatarFallback: 'MR',
  },
  {
    name: 'David C.',
    role: 'Patient',
    testimonial:
      'The video call quality was excellent, and the doctor was very attentive. I received my prescription immediately after. Highly recommended!',
    image: findImage('testimonial-3'),
    avatarFallback: 'DC',
  },
];

export const weeklyAppointments = [
  { day: 'Mon', appointments: 12 },
  { day: 'Tue', appointments: 18 },
  { day: 'Wed', appointments: 8 },
  { day: 'Thu', appointments: 15 },
  { day: 'Fri', appointments: 10 },
  { day: 'Sat', appointments: 20 },
  { day: 'Sun', appointments: 5 },
];

export const recentPatients = [
  {
    name: 'Liam Johnson',
    email: 'liam@example.com',
    status: 'Follow-up',
    image: findImage('testimonial-1'),
    avatarFallback: 'LJ',
  },
  {
    name: 'Olivia Smith',
    email: 'olivia@example.com',
    status: 'New Patient',
    image: findImage('testimonial-3'),
    avatarFallback: 'OS',
  },
  {
    name: 'Noah Williams',
    email: 'noah@example.com',
    status: 'Routine Check-up',
    image: null,
    avatarFallback: 'NW',
  },
  {
    name: 'Emma Brown',
    email: 'emma@example.com',
    status: 'Follow-up',
    image: findImage('testimonial-1'),
    avatarFallback: 'EB',
  },
    {
    name: 'James Jones',
    email: 'james@example.com',
    status: 'New Patient',
    image: null,
    avatarFallback: 'JJ',
  },
];
