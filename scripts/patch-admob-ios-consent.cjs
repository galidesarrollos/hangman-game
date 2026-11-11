// AdMob 8.2.1 discards the underlying iOS UMP error. Keep the real reason
// visible and use previously gathered consent only when UMP explicitly allows ads.
const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '..', 'node_modules', '@capacitor-community', 'admob',
  'ios', 'Sources', 'AdMobPlugin', 'Consent', 'ConsentExecutor.swift');
const source = fs.readFileSync(file, 'utf8');
const original = `                if error != nil {
                    call.reject("Request consent info failed")
                } else {`;
const replacement = `                if let error = error {
                    let nativeError = error as NSError
                    let details = "UMP \\(nativeError.domain) code \\(nativeError.code): \\(nativeError.localizedDescription)"
                    if ConsentInformation.shared.canRequestAds {
                        call.resolve([
                            "status": self.getConsentStatusString(ConsentInformation.shared.consentStatus),
                            "isConsentFormAvailable": ConsentInformation.shared.formStatus == FormStatus.available,
                            "canRequestAds": true,
                            "privacyOptionsRequirementStatus": self.getPrivacyOptionsRequirementStatus(ConsentInformation.shared.privacyOptionsRequirementStatus),
                            "requestError": details
                        ])
                    } else {
                        call.reject(details, String(nativeError.code))
                    }
                } else {`;

if (source.includes(original)) {
  fs.writeFileSync(file, source.replace(original, replacement));
  console.log('Applied iOS UMP diagnostics to AdMob 8.2.1');
} else if (!source.includes(replacement)) {
  throw new Error('AdMob ConsentExecutor.swift changed; review the iOS UMP patch');
}
