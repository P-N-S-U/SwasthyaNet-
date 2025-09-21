
import data from '@/lib/placeholder-images.json';

const { placeholderImages } = data;

const findImage = (id: string) => placeholderImages.find(img => img.id === id);

export const testimonials = [
  {
    name: 'Priya S.',
    role: 'Patient',
    testimonial:
      'SwasthyaNet made it so easy to find a specialist and get a consultation without leaving my home. The AI symptom checker was surprisingly accurate!',
    image: findImage('testimonial-1'),
    avatarFallback: 'PS',
  },
  {
    name: 'Dr. Arjun M.',
    role: 'Cardiologist',
    testimonial:
      'As a doctor, this platform has streamlined my workflow. I can manage appointments, consult with patients, and issue prescriptions all in one place.',
    image: findImage('testimonial-2'),
    avatarFallback: 'AM',
  },
  {
    name: 'Rohan K.',
    role: 'Patient',
    testimonial:
      'The video call quality was excellent, and the doctor was very attentive. I received my prescription immediately after. Highly recommended!',
    image: findImage('testimonial-3'),
    avatarFallback: 'RK',
  },
];

export const recentPatients = [
  {
    name: 'Rohan Kumar',
    email: 'rohan@example.com',
    status: 'Follow-up',
    image: findImage('testimonial-3'),
    avatarFallback: 'RK',
  },
  {
    name: 'Aisha Khan',
    email: 'aisha@example.com',
    status: 'New Patient',
    image: findImage('testimonial-1'),
    avatarFallback: 'AK',
  },
  {
    name: 'Aditya Verma',
    email: 'aditya@example.com',
    status: 'Routine Check-up',
    image: null,
    avatarFallback: 'AV',
  },
  {
    name: 'Priya Sharma',
    email: 'priya@example.com',
    status: 'Follow-up',
    image: findImage('testimonial-1'),
    avatarFallback: 'PS',
  },
    {
    name: 'Sameer Gupta',
    email: 'sameer@example.com',
    status: 'New Patient',
    image: null,
    avatarFallback: 'SG',
  },
];
