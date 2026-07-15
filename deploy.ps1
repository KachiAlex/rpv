Set-Location -Path "d:\RPV\rpv-bible"
npm run build
if ($?) {
    firebase deploy --only hosting
}
