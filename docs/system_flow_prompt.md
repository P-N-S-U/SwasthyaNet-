
# Prompt for Generating a SwasthyaNet System Flow Diagram

**Objective:** Create a comprehensive flow diagram for the SwasthyaNet telemedicine web application. The diagram should illustrate user roles, authentication flows, key features, and data interactions between the user, the Next.js frontend, Firebase backend services, and Genkit AI flows.

---

## **1. User Roles & Authentication**

There are three primary user roles and one admin role:
- **Patient**: End-user seeking medical consultation.
- **Doctor**: Medical professional providing consultations.
- **Partner**: Businesses (Pharmacies, Labs) integrating with the platform.
- **Admin**: Superuser for managing the platform.

### **Authentication Flows:**
- **Patient/Doctor Signup & Sign-in:**
  - Users can sign up using Email/Password or Google OAuth.
  - On signup, a `role` ('patient' or 'doctor') is selected.
  - A new user is created in **Firebase Authentication**.
  - A corresponding document is created in the **Firestore `users` collection** with their UID, name, email, photoURL, and role.
  - A server-side session cookie is created via a Next.js API route (`/api/auth/session`).
- **Partner Signup & Sign-in:**
  - Partners sign up using Email/Password only.
  - They provide business details (name, type, address).
  - A new user is created in **Firebase Authentication**.
  - A document is created **only** in the **Firestore `partners` collection**. This document includes business details, an `ownerUID` matching their auth UID, and a `status` of "pending".
  - A server-side session cookie is created.
- **Admin Login:**
  - Admins log in via a separate, secure page (`/admin-login`).
  - Credentials (`admin`/`admin@123`) are hardcoded.
  - A secure, encrypted session cookie is created using a secret key (not Firebase Auth).
- **Session Management:**
  - All user sessions are verified on the server-side via middleware or in layouts using session cookies.
  - Role-based redirects happen at the `/dashboard` level, sending users to their respective dashboards (`/patient/dashboard`, `/doctor/dashboard`, `/partner/dashboard`).

---

## **2. Patient User Flow**

1.  **Dashboard (`/patient/dashboard`):**
    - Views key action cards: AI Symptom Checker, Find a Doctor, View Appointments, Nearby Pharmacies.
    - Views a count of upcoming appointments.
2.  **AI Symptom Checker (`/symptom-checker`):**
    - Patient enters symptoms into a form.
    - The form calls a **Genkit Flow (`ai-symptom-checker`)**.
    - The flow returns potential conditions, recommended actions, and a disclaimer, which are displayed to the patient.
3.  **Find a Doctor (`/find-a-doctor`):**
    - Patient searches for doctors by name or specialization.
    - The frontend action queries the **`users` collection** in Firestore for documents where `role == 'doctor'` and the profile is complete.
    - Search results are displayed. The patient can view a doctor's profile or book an appointment.
4.  **Book Appointment:**
    - Clicking "Book Now" triggers a server action (`bookAppointment`).
    - The action checks for existing appointments, then creates a new document in the **`appointments` collection** with patient/doctor IDs, names, and a future `appointmentDate`. Status is set to 'Confirmed'.
5.  **Video Consultation (`/patient/video/[id]`):**
    - Patient joins a video call for a confirmed appointment.
    - The system uses **WebRTC** for peer-to-peer connection, brokered by Firestore.
    - A document in the **`calls` collection** (using the appointment ID as the document ID) is used to exchange WebRTC signaling data (offer, answer, ICE candidates).
6.  **View Prescriptions (`/patient/prescriptions/[id]`):**
    - After a 'Completed' appointment, if a prescription exists, a link appears.
    - The patient can view the detailed prescription, which is read from the **`prescriptions` collection**.
7.  **Find Nearby Pharmacies (`/patient/pharmacies`):**
    - The component gets the user's browser location.
    - It sends the location to a server action that queries the **`partners` collection** for approved pharmacies with GPS coordinates.
    - Displays pharmacies on a Leaflet map and in a list, sorted by distance.

---

## **3. Doctor User Flow**

1.  **Dashboard (`/doctor/dashboard`):**
    - Views upcoming appointment, weekly activity chart, and key stats (total patients, fees, etc.).
    - Can join the next video call or write a prescription.
    - Accesses a list of recent patients.
2.  **Profile Management (`/doctor/profile`):**
    - Doctor can update their professional details (specialization, qualifications, experience, fee).
    - These details are saved to their document in the **`users` collection**.
3.  **Schedule (`/doctor/schedule`):**
    - Views a calendar showing all booked appointment dates.
    - Selecting a date lists all appointments for that day.
4.  **Video Consultation (`/doctor/video/[id]`):**
    - Same WebRTC flow as the patient.
    - Doctor has controls to end the call, which triggers the 'completion' flow.
5.  **Create Prescription (`/doctor/prescriptions/new`):**
    - After completing a call, the doctor is often redirected here.
    - The doctor fills out a form with diagnosis and medication details.
    - The form can use a **Genkit Flow (`prescription-generator`)** to suggest medications based on the diagnosis.
    - On submission, a document is created in the **`prescriptions` collection** (using the appointment ID as the document ID). The corresponding document in the **`appointments` collection** is updated with `hasPrescription: true`.

---

## **4. Partner User Flow**

1.  **Dashboard (`/partner/dashboard`):**
    - After signup, the partner sees a "Pending Approval" status.
    - If approved, they see their main dashboard (currently has placeholder for prescription requests).
2.  **Profile Management (`/partner/profile`):**
    - Partner updates their business details (license number, contact, address).
    - They can perform two key verification actions:
        - **Verify Location**: Captures browser GPS coordinates and saves them to their document in the **`partners` collection**.
        - **Upload Document**: Uploads a verification file to **Firebase Storage**, and the URL is saved to their document in the **`partners` collection**.

---

## **5. Admin Flow**

1.  **Dashboard (`/obviouslynotadmin`):**
    - Views platform-wide stats (total users, doctors, partners, appointments).
    - Sees a chart of weekly appointment activity.
2.  **Partner Management (`/obviouslynotadmin/partners`):**
    - Admin views a list of all businesses from the **`partners` collection**.
    - For partners with a "pending" status, the admin has "Approve" and "Reject" buttons.
    - Clicking these buttons triggers a server action that updates the `status` field in the corresponding **`partners` document**.

---

## **6. Key Technologies & Data Flow**

- **Frontend**: Next.js (App Router), React, Tailwind CSS, ShadCN UI
- **Backend Services**: Firebase
    - **Authentication**: Manages all user identities.
    - **Firestore**: Primary database with collections: `users`, `partners`, `appointments`, `prescriptions`, `calls`.
    - **Storage**: Stores partner verification documents.
- **Generative AI**: Genkit
    - Flows are defined on the server (`/ai/flows`).
    - They are called from the client via Next.js Server Actions.
- **Real-time Video**: WebRTC, with Firestore used as the signaling server.
- **Security**: Firestore Security Rules define access control for all collections based on `request.auth` (user's UID and role).

The diagram should use clear visual cues (like swimlanes or color-coding) to distinguish between the different user roles (Patient, Doctor, Partner, Admin). It should also clearly differentiate between client-side components, Next.js server actions, Firebase services, and Genkit flows for maximum clarity.
