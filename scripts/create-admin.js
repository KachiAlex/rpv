/**
 * Script to create a default admin account
 * 
 * Usage:
 *   Option 1: Using Firebase Admin SDK with service account
 *     node scripts/create-admin.js --email admin@example.com --password YourPassword123
 *   
 *   Option 2: Using existing user email (promotes existing user to admin)
 *     node scripts/create-admin.js --email existing@example.com --promote
 * 
 * Environment Variables:
 *   - FIREBASE_PROJECT_ID: Your Firebase project ID
 *   - GOOGLE_APPLICATION_CREDENTIALS: Path to service account key (for Admin SDK)
 *   OR set up Firebase config in .env.local
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
// Try to use service account if available, otherwise use application default credentials
let app;
let projectId = process.env.FIREBASE_PROJECT_ID;

// Try to read from .firebaserc
if (!projectId) {
  try {
    const fs = require('fs');
    const path = require('path');
    const firebasercPath = path.join(__dirname, '..', '.firebaserc');
    if (fs.existsSync(firebasercPath)) {
      const firebaserc = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
      projectId = firebaserc.projects?.default;
    }
  } catch (error) {
    // Ignore errors reading .firebaserc
  }
}

try {
  // Check if service account key is provided
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId || serviceAccount.project_id,
    });
  } else if (projectId) {
    // Try to use application default credentials (for Firebase CLI users)
    // This requires GOOGLE_APPLICATION_CREDENTIALS to be set or gcloud to be configured
    try {
      app = admin.initializeApp({
        projectId: projectId,
      });
      // Test if we can access Firestore
      await admin.firestore().collection('_test').limit(1).get();
    } catch (credError) {
      console.error('\n⚠️  Cannot use application default credentials.');
      console.error('You need to either:');
      console.error('1. Use a service account key file');
      console.error('2. Or use gcloud CLI: gcloud auth application-default login');
      console.error('\nFor now, let\'s use Firebase CLI to get credentials...');
      throw new Error('Application default credentials not available');
    }
  } else {
    console.error('Error: Firebase not configured.');
    console.error('Please set FIREBASE_PROJECT_ID or GOOGLE_APPLICATION_CREDENTIALS');
    console.error('Or use Firebase CLI: firebase login --no-localhost');
    console.error('Or ensure .firebaserc exists with project configuration');
    process.exit(1);
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  console.error('\nTo use this script, you need to either:');
  console.error('1. Set GOOGLE_APPLICATION_CREDENTIALS to a service account key file');
  console.error('2. Use Firebase CLI: firebase login --no-localhost');
  console.error('3. Set FIREBASE_PROJECT_ID environment variable');
  console.error('4. Ensure .firebaserc exists with project configuration');
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

// Parse command line arguments
const args = process.argv.slice(2);
const emailIndex = args.indexOf('--email');
const passwordIndex = args.indexOf('--password');
const promoteIndex = args.indexOf('--promote');
const defaultEmail = 'admin@rpvbible.com';
const defaultPassword = 'Admin123!@#';

const email = emailIndex !== -1 && args[emailIndex + 1] ? args[emailIndex + 1] : defaultEmail;
const password = passwordIndex !== -1 && args[passwordIndex + 1] ? args[passwordIndex + 1] : defaultPassword;
const promoteOnly = promoteIndex !== -1;

async function createAdminAccount() {
  try {
    console.log('Creating admin account...');
    console.log(`Email: ${email}`);
    
    let userId;
    
    if (promoteOnly) {
      // Promote existing user to admin
      console.log('Promoting existing user to admin...');
      try {
        const user = await auth.getUserByEmail(email);
        userId = user.uid;
        console.log(`Found existing user: ${user.uid}`);
      } catch (error) {
        console.error(`Error: User with email ${email} not found.`);
        console.error('Please create the user first or use --email and --password to create a new account.');
        process.exit(1);
      }
    } else {
      // Create new user account
      try {
        const user = await auth.getUserByEmail(email);
        userId = user.uid;
        console.log(`User already exists: ${user.uid}`);
      } catch (error) {
        // User doesn't exist, create it
        console.log('Creating new user account...');
        const userRecord = await auth.createUser({
          email: email,
          password: password,
          emailVerified: true,
        });
        userId = userRecord.uid;
        console.log(`Created new user: ${userId}`);
      }
    }
    
    // Set admin role in Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create user profile if it doesn't exist
      await userRef.set({
        uid: userId,
        email: email,
        displayName: email.split('@')[0],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        preferences: {
          theme: 'auto',
          fontSize: 'medium',
          defaultTranslation: null,
          language: 'en',
        },
        role: 'admin',
      });
      console.log('Created user profile with admin role');
    } else {
      // Update existing profile to admin
      await userRef.update({
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('Updated user profile to admin role');
    }
    
    // Set custom claim for admin (for Firestore security rules)
    await auth.setCustomUserClaims(userId, { admin: true });
    console.log('Set admin custom claim');
    
    console.log('\n✅ Admin account created successfully!');
    console.log(`Email: ${email}`);
    if (!promoteOnly) {
      console.log(`Password: ${password}`);
    }
    console.log(`User ID: ${userId}`);
    console.log('\n⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('Error creating admin account:', error.message);
    process.exit(1);
  }
}

// Run the script
createAdminAccount().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

