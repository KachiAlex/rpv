# Admin Setup Scripts

## Create Default Admin Account

This script helps you create a default admin account for the RPV Bible application.

### Prerequisites

You need one of the following:

1. **Firebase CLI** (recommended for development)
   ```bash
   npm install -g firebase-tools
   firebase login --no-localhost
   ```

2. **Service Account Key** (for production)
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the key file and set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

3. **Environment Variables**
   - Set `FIREBASE_PROJECT_ID` to your Firebase project ID

### Usage

#### Option 1: Create New Admin Account (Default)

Creates a new admin account with default credentials:
- Email: `admin@rpvbible.com`
- Password: `Admin123!@#`

```bash
npm run create-admin
```

Or with custom email and password:

```bash
node scripts/create-admin.js --email your-admin@example.com --password YourSecurePassword123
```

#### Option 2: Promote Existing User to Admin

If you already have a user account, you can promote them to admin:

```bash
node scripts/create-admin.js --email existing@example.com --promote
```

### Environment Setup

For local development, you can set environment variables:

**Windows (PowerShell):**
```powershell
$env:FIREBASE_PROJECT_ID="your-project-id"
node scripts/create-admin.js
```

**Windows (CMD):**
```cmd
set FIREBASE_PROJECT_ID=your-project-id
node scripts/create-admin.js
```

**Linux/Mac:**
```bash
export FIREBASE_PROJECT_ID="your-project-id"
node scripts/create-admin.js
```

### Using Firebase CLI (Recommended)

If you have Firebase CLI installed and logged in, the script will automatically use your project from `.firebaserc`:

```bash
# Make sure you're logged in to Firebase
firebase login --no-localhost

# The script will use the project from .firebaserc (redemptionprojectversion)
npm run create-admin
```

Or explicitly set the project:

```bash
firebase use redemptionprojectversion
npm run create-admin
```

### Using Service Account Key

1. Download service account key from Firebase Console
2. Save it securely (e.g., `service-account-key.json`)
3. Set environment variable:

**Windows (PowerShell):**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account-key.json"
$env:FIREBASE_PROJECT_ID="redemptionprojectversion"
node scripts/create-admin.js
```

**Linux/Mac:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
export FIREBASE_PROJECT_ID="redemptionprojectversion"
node scripts/create-admin.js
```

### Security Notes

⚠️ **Important:**
- Change the default password immediately after first login
- Never commit service account keys to version control
- Use strong passwords for production
- The script sets both Firestore role and Firebase Auth custom claims

### Troubleshooting

**Error: Firebase not configured**
- Make sure you've set `FIREBASE_PROJECT_ID` or have Firebase CLI logged in
- Or provide a service account key via `GOOGLE_APPLICATION_CREDENTIALS`

**Error: Permission denied**
- Make sure your service account has "Firebase Admin" permissions
- Or use Firebase CLI with proper authentication

**Error: User already exists**
- The script will use the existing user and just promote them to admin
- Or use `--promote` flag if you only want to promote an existing user

