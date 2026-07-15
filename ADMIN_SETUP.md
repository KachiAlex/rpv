# Admin Account Setup Guide

## Quick Setup (Recommended)

The easiest way to create your first admin account is through the **Firebase Console**:

### Step 1: Create User in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/redemptionprojectversion)
2. Navigate to **Authentication** > **Users**
3. Click **Add user**
4. Enter:
   - Email: `admin@rpvbible.com`
   - Password: `Admin123!@#` (or your secure password)
5. Click **Add user**

### Step 2: Set Admin Role in Firestore

1. Note the **User UID** from the Authentication page
2. Go to **Firestore Database**
3. Click **Start collection** (if collections don't exist)
4. Create collection: `users`
5. Create document with ID = the User UID from step 1
6. Add these fields:
   - `email`: `admin@rpvbible.com`
   - `role`: `admin`
   - `displayName`: `Admin`
   - `createdAt`: (current timestamp)
   - `preferences`: `{ theme: 'auto', fontSize: 'medium', defaultTranslation: null, language: 'en' }`

### Step 3: Set Custom Claims (Optional but Recommended)

For Firestore security rules, you can also set custom claims using the script:

```bash
# Get service account key first (see below), then:
$env:GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
node scripts/create-admin.js --email admin@rpvbible.com --promote
```

## Alternative: Using Script with Service Account Key

### Step 1: Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/project/redemptionprojectversion/settings/serviceaccounts/adminsdk)
2. Click **Generate new private key**
3. Save the JSON file (e.g., `service-account-key.json`)
4. **Important**: Keep this file secure and never commit it to git!

### Step 2: Run the Script

**Windows PowerShell:**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account-key.json"
npm run create-admin
```

**Windows CMD:**
```cmd
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account-key.json
npm run create-admin
```

**Linux/Mac:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
npm run create-admin
```

### Step 3: Custom Credentials

To use custom email/password:
```bash
node scripts/create-admin.js --email your-admin@example.com --password YourSecurePassword123
```

## Web-Based Setup (Alternative)

If you prefer a web interface, visit `/setup` after deploying:

1. Navigate to: `https://redemptionprojectversion.web.app/setup`
2. Fill in the form to create your admin account
3. The account will be created with admin role automatically

## After Setup

1. Sign in with your admin credentials at `/login`
2. You'll have access to the `/admin` page
3. **Important**: Change your password after first login!

## Security Notes

- ⚠️ Never commit service account keys to version control
- ⚠️ Use strong passwords for production
- ⚠️ Consider removing the `/setup` page after initial setup
- ⚠️ Limit access to admin accounts

