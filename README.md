# Tatweer Certificates - QR Code Stamping & Verification

This is a Next.js application built to securely stamp digital certificates with QR codes and provide a public-facing verification system. The application uses Firebase for backend services (Firestore Database and Storage) and Genkit for AI-powered QR code generation and PDF manipulation.

## Features

-   **Upload & Stamp:** Upload a PDF certificate, add relevant details, and apply a unique, verifiable QR code.
-   **Position & Resize QR Code:** Interactively drag and resize the QR code on a preview of the certificate.
-   **Secure Storage:** Stamped PDFs are saved to Firebase Storage, and certificate metadata is saved to Firestore.
-   **Instant Verification:** Verify any certificate's authenticity and status by its ID, either through a dedicated verification page or a direct link from the QR code.

## Tech Stack

-   **Framework:** Next.js (App Router)
-   **UI:** React, TypeScript, Tailwind CSS, ShadCN UI
-   **Backend & Database:** Firebase (Firestore & Storage)
-   **AI & PDF Processing:** Genkit

---

## Local Development Setup

Follow these steps to get the project running on your local machine.

### Prerequisites

-   [Node.js](https://nodejs.org/en) (v18 or later recommended)
-   A [Firebase](https://firebase.google.com/) project.

### 1. Set up your Firebase Project

If you haven't already, create a new project in the [Firebase Console](https://console.firebase.google.com/).

-   **Firestore:** In your project, go to **Build > Firestore Database** and click **Create database**. Start in **test mode** for easy local development.
-   **Storage:** Go to **Build > Storage** and click **Get started**. Start in **test mode**. This will set the security rules to allow uploads from your local app.

### 2. Configure Environment Variables

You need to provide your Firebase project's credentials to the application.

1.  In your project's root directory, create a new file named `.env`
2.  Copy the content of `.env.example` into your new `.env` file.
3.  Go to your Firebase project's **Project Settings** (click the gear icon ⚙️) and find your **Web App** configuration.
4.  Copy the values and paste them into your `.env` file. It should look like this:

```bash
# Firebase Web App Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...
```

### 3. Install Dependencies

Open your terminal in the project's root directory and run:

```bash
npm install
```

### 4. Run the Development Server

Now you can start the application:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser to see the result. The application will now be connected to your Firebase project.
