# SwasthyaNet - A Telemedicine Web Application

SwasthyaNet is a modern, full-featured telemedicine web application designed to bridge the gap between patients and doctors. It provides a seamless, secure, and intelligent platform for online consultations, appointment booking, and preliminary symptom analysis.

## Key Features

- **User Authentication**: Secure sign-up and sign-in for patients and doctors using Firebase Authentication.
- **AI-Powered Symptom Checker**: A Genkit-powered chatbot that provides preliminary analysis based on user-described symptoms.
- **Find a Doctor**: A smart search feature for patients to find and get recommendations for doctors based on specialization or name.
- **Appointment Booking**: Patients can easily book appointments with their chosen doctors.
- **Real-time Video Consultations**: Secure, peer-to-peer video call functionality using WebRTC for consultations.
- **Patient and Doctor Dashboards**: Separate, tailored dashboards for patients and doctors to manage their activities.
- **Electronic Health Records (EHR)**: Doctors can view patient profiles and their appointment history.
- **Responsive Design**: A mobile-first design that ensures a great user experience on all devices.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **AI/Generative AI**: [Genkit](https://firebase.google.com/docs/genkit)
- **Backend & Database**: [Firebase](https://firebase.google.com/)
  - **Authentication**: Firebase Authentication
  - **Database**: Firestore
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)
- **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/swasthyanet.git
    cd swasthyanet
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Environment Variables

This project uses Firebase for its backend services. To run the application, you'll need to create a `.env` file in the root of the project and add your Firebase project credentials.

Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/). Then, find your project's configuration and service account keys to populate the `.env` file.

```.env
# Firebase Public Config (for client-side)
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-firebase-project-id"
NEXT_PUBLIC_FIREBASE_API_KEY="your-web-api-key"

# Firebase Admin Config (for server-side)
# Create a service account in Firebase Project Settings and get these values
FIREBASE_CLIENT_EMAIL="your-service-account-email"
FIREBASE_PRIVATE_KEY="your-service-account-private-key"
```

### Running the Development Server

Once the dependencies are installed and the environment variables are set, you can run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

The Genkit flows can be run in a separate terminal for local development and testing:
```bash
npm run genkit:dev
```

This will start the Genkit development server, allowing you to interact with your AI flows.
