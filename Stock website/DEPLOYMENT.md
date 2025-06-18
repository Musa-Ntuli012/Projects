# Deployment Guide

This guide will help you deploy the Stock Management System to production. We'll use Firebase Hosting for the frontend and Firebase Functions for the backend.

## Prerequisites

1. Install the Firebase CLI globally:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project:
```bash
firebase init
```

During initialization:
- Select "Hosting" and "Functions"
- Choose your Firebase project
- Use "build" as your public directory
- Configure as a single-page app: Yes
- Set up automatic builds and deploys: Yes

## Environment Setup

1. Create a `.env.production` file in the root directory:
```
REACT_APP_API_URL=https://your-project-id.cloudfunctions.net/api
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Build and Deploy

1. Build the React application:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy
```

## Post-Deployment Steps

1. Verify your Firebase Security Rules:
   - Go to Firebase Console > Firestore Database > Rules
   - Ensure your rules are properly configured for production

2. Set up Firebase Authentication:
   - Go to Firebase Console > Authentication
   - Enable the authentication methods you want to use
   - Configure any additional security settings

3. Set up Firebase Analytics (optional):
   - Go to Firebase Console > Analytics
   - Follow the setup instructions for your platform

## Monitoring and Maintenance

1. Monitor your application:
   - Use Firebase Console to monitor performance, errors, and usage
   - Set up alerts for critical issues

2. Regular maintenance:
   - Keep dependencies updated
   - Monitor Firebase usage and costs
   - Regularly backup your Firestore database

## Troubleshooting

Common issues and solutions:

1. Build fails:
   - Check for environment variables
   - Verify all dependencies are installed
   - Check for syntax errors

2. Deployment fails:
   - Verify Firebase CLI is logged in
   - Check project permissions
   - Verify Firebase project configuration

3. Runtime errors:
   - Check Firebase Console logs
   - Verify environment variables
   - Check Firebase Security Rules

## Support

For additional support:
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://reactjs.org/docs)
- [Material-UI Documentation](https://mui.com/material-ui/getting-started/) 