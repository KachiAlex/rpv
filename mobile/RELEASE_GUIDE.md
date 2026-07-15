# RPV Bible Release Guide

## Pre-Release Checklist

### Code Quality
- [ ] All tests passing
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Code reviewed
- [ ] No hardcoded credentials

### Functionality
- [ ] Search works
- [ ] Reading works
- [ ] Bookmarks work
- [ ] Offline mode works
- [ ] Sync works
- [ ] Admin features work

### Performance
- [ ] App startup < 2s
- [ ] Search response < 500ms
- [ ] Memory usage < 100MB
- [ ] Battery drain acceptable

### Security
- [ ] Firebase rules configured
- [ ] API keys protected
- [ ] No sensitive data in logs
- [ ] HTTPS only
- [ ] Input validation

### Device Testing
- [ ] Tested on Android 8+
- [ ] Tested on small phones
- [ ] Tested on large phones
- [ ] Tested on tablets
- [ ] Tested landscape mode
- [ ] Tested offline

## Release Process

### 1. Prepare Release

#### Update Version

```bash
node scripts/version.js increment patch
```

#### Create Release Notes

Create `RELEASE_NOTES.md`:

```markdown
# RPV Bible v1.0.0

## New Features
- Bible search with multiple translations
- Offline reading support
- Bookmark management
- User preferences sync
- Admin dashboard

## Bug Fixes
- Fixed search performance
- Fixed offline sync issues
- Fixed UI responsiveness

## Known Issues
- None

## Installation
Download from Google Play Store
```

#### Update Changelog

Add to `CHANGELOG.md`:

```markdown
## [1.0.0] - 2024-01-XX

### Added
- Initial release
- Bible search
- Offline support
- Bookmarks
- Admin features

### Fixed
- N/A

### Changed
- N/A
```

### 2. Build Release

#### Build Production APK

```bash
./scripts/build.sh production
```

Or manually:

```bash
eas build --platform android --profile production
```

#### Download APK

1. Go to EAS dashboard
2. Find production build
3. Download APK/App Bundle

#### Test APK

1. Install on test device:
```bash
adb install app-release.apk
```

2. Run through test scenarios
3. Verify all features work
4. Check performance

### 3. Sign Release

#### Automatic Signing (Recommended)

EAS handles signing automatically for production builds.

#### Manual Signing (If Needed)

```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore rpv-bible.keystore \
  app-release-unsigned.apk rpv-bible
```

### 4. Prepare Google Play Store

#### Create Release in Play Console

1. Go to Google Play Console
2. Select RPV Bible app
3. Go to Release > Production
4. Click "Create new release"

#### Upload APK/Bundle

1. Click "Browse files"
2. Select signed APK or App Bundle
3. Upload

#### Add Release Notes

```
Version 1.0.0

New Features:
- Complete Bible app with search
- Offline reading support
- Bookmark management
- User account sync
- Admin dashboard

Bug Fixes:
- Performance improvements
- UI fixes

Known Issues:
- None
```

#### Configure Release

1. **Rollout percentage**: Start with 10%
2. **Staged rollout**: Increase gradually
3. **Monitoring**: Watch crash reports

### 5. Publish Release

#### Review Release

1. Check all information
2. Verify screenshots
3. Verify description
4. Verify content rating

#### Publish

1. Click "Review release"
2. Click "Start rollout to Production"
3. Confirm

#### Monitor

1. Check crash reports
2. Monitor user reviews
3. Track performance metrics
4. Plan next release

## Post-Release

### Monitoring

#### Crash Reports

1. Go to Google Play Console
2. Check "Crashes & ANRs"
3. Fix critical issues
4. Release hotfix if needed

#### User Reviews

1. Monitor 1-star reviews
2. Respond to feedback
3. Fix reported issues
4. Plan improvements

#### Performance Metrics

1. Check app size
2. Monitor startup time
3. Check memory usage
4. Monitor battery drain

### Hotfix Release

If critical issues found:

1. Fix issue in code
2. Increment patch version
3. Build new APK
4. Test thoroughly
5. Upload to Play Store
6. Set rollout to 100%

### Next Release Planning

1. Collect user feedback
2. Plan new features
3. Schedule next release
4. Create feature branches
5. Start development

## Release Versioning

### Version Format

`MAJOR.MINOR.PATCH`

Example: `1.0.0`

### Versioning Rules

- **MAJOR**: Breaking changes, major features
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, minor improvements

### Examples

- `1.0.0` - Initial release
- `1.0.1` - Bug fix
- `1.1.0` - New feature
- `2.0.0` - Major rewrite

## Release Timeline

### Week 1: Preparation
- [ ] Code review
- [ ] Testing
- [ ] Documentation
- [ ] Version bump

### Week 2: Build & Test
- [ ] Build APK
- [ ] Device testing
- [ ] Performance testing
- [ ] Security review

### Week 3: Release
- [ ] Play Store upload
- [ ] Release notes
- [ ] Staged rollout
- [ ] Monitoring

### Week 4: Post-Release
- [ ] Monitor crashes
- [ ] Respond to reviews
- [ ] Plan next release
- [ ] Hotfixes if needed

## Rollback Plan

If critical issues after release:

1. **Pause rollout**: Stop new installations
2. **Investigate**: Find root cause
3. **Fix**: Create hotfix
4. **Test**: Verify fix works
5. **Release**: Deploy hotfix
6. **Resume**: Resume rollout

## Communication

### Release Announcement

Post on social media:

```
🎉 RPV Bible v1.0.0 is now available!

✨ Features:
- Bible search with multiple translations
- Offline reading support
- Bookmark management
- User account sync

📱 Download now from Google Play Store

#Bible #App #Android
```

### User Support

1. Monitor support emails
2. Respond to user issues
3. Create FAQ
4. Update documentation

## Compliance

### Google Play Store Policies

- [ ] App complies with policies
- [ ] Content rating appropriate
- [ ] Privacy policy provided
- [ ] Terms of service provided
- [ ] No prohibited content

### Data Privacy

- [ ] Privacy policy clear
- [ ] Data collection disclosed
- [ ] User consent obtained
- [ ] Data protected
- [ ] GDPR compliant

## Success Metrics

### Installation Metrics
- Target: 1,000+ installs in first month
- Track: Daily active users
- Monitor: Retention rate

### Performance Metrics
- Target: < 2s startup time
- Target: < 500ms search
- Target: < 100MB memory

### User Satisfaction
- Target: 4.5+ star rating
- Monitor: User reviews
- Track: Support tickets

## Troubleshooting

### Build Fails

1. Check EAS logs
2. Verify credentials
3. Clear cache
4. Retry build

### Upload Fails

1. Check file size
2. Verify signing
3. Check Play Console
4. Retry upload

### App Crashes

1. Check crash reports
2. Reproduce issue
3. Fix code
4. Release hotfix

## Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [EAS Build Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Android Best Practices](https://developer.android.com/guide)

## Contacts

- **Support Email**: support@rpvbible.com
- **Bug Reports**: bugs@rpvbible.com
- **Feature Requests**: features@rpvbible.com
