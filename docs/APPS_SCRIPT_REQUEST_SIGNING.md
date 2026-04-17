# Apps Script Request Signing

This project can now send optional signed metadata from the Cloudflare Worker to the Google Apps Script admin backend when `ADMIN_BACKEND_SIGNING_SECRET` is configured in the Worker.

The Worker adds:

- query params
  - `_workerTs`
  - `_workerBodySha256`
  - `_workerSig`
- headers
  - `X-IELTS-Worker-Proxy: 1`
  - `X-IELTS-Worker-Timestamp`
  - `X-IELTS-Worker-Body-SHA256`
  - `X-IELTS-Worker-Signature`

For Google Apps Script web apps, the **query params** are the reliable verification path.

## Script Property

Create this script property in the Google Apps Script project:

- `WORKER_SIGNING_SECRET`

Set it to the same long random value you use for:

- `ADMIN_BACKEND_SIGNING_SECRET`

## Paste Into Apps Script

```javascript
function verifyWorkerRequest_(e) {
  var secret = PropertiesService.getScriptProperties().getProperty('WORKER_SIGNING_SECRET');
  if (!secret) {
    return { ok: false, error: 'Missing WORKER_SIGNING_SECRET.' };
  }

  var method = String((e && e.postData) ? 'POST' : 'GET');
  var timestamp = String((e && e.parameter && e.parameter._workerTs) || '').trim();
  var providedBodyHash = String((e && e.parameter && e.parameter._workerBodySha256) || '').trim();
  var providedSignature = String((e && e.parameter && e.parameter._workerSig) || '').trim();
  if (!timestamp || !providedBodyHash || !providedSignature) {
    return { ok: false, error: 'Missing worker signing parameters.' };
  }

  var ts = Number(timestamp);
  if (!isFinite(ts)) {
    return { ok: false, error: 'Invalid worker timestamp.' };
  }
  var maxSkewMs = 5 * 60 * 1000;
  if (Math.abs(Date.now() - ts) > maxSkewMs) {
    return { ok: false, error: 'Expired worker timestamp.' };
  }

  var bodyText = (e && e.postData && typeof e.postData.contents === 'string') ? e.postData.contents : '';
  var actualBodyHash = sha256Base64Url_(bodyText);
  if (!constantTimeEquals_(providedBodyHash, actualBodyHash)) {
    return { ok: false, error: 'Worker body hash mismatch.' };
  }

  var canonicalQuery = canonicalizeWorkerParams_(e && e.parameters ? e.parameters : {});
  var payload = [method, timestamp, canonicalQuery, providedBodyHash].join('\n');
  var expectedSignature = hmacSha256Base64Url_(payload, secret);
  if (!constantTimeEquals_(providedSignature, expectedSignature)) {
    return { ok: false, error: 'Invalid worker signature.' };
  }

  return { ok: true };
}

function canonicalizeWorkerParams_(parameters) {
  var pairs = [];
  Object.keys(parameters || {}).forEach(function(key) {
    if (key === '_workerSig') return;
    var values = parameters[key];
    if (!Array.isArray(values)) values = [values];
    values.forEach(function(value) {
      pairs.push([String(key || ''), String(value || '')]);
    });
  });
  pairs.sort(function(a, b) {
    if (a[0] === b[0]) return a[1] < b[1] ? -1 : (a[1] > b[1] ? 1 : 0);
    return a[0] < b[0] ? -1 : 1;
  });
  return pairs.map(function(pair) {
    return encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]);
  }).join('&');
}

function hmacSha256Base64Url_(payload, secret) {
  var signature = Utilities.computeHmacSha256Signature(payload, secret);
  return base64UrlFromBytes_(signature);
}

function sha256Base64Url_(value) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
  return base64UrlFromBytes_(digest);
}

function base64UrlFromBytes_(bytes) {
  var base64 = Utilities.base64EncodeWebSafe(bytes);
  return String(base64 || '').replace(/=+$/g, '');
}

function constantTimeEquals_(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (a.length !== b.length) return false;
  var mismatch = 0;
  for (var i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
```

## How To Use It

Call `verifyWorkerRequest_(e)` at the top of your `doGet(e)` and `doPost(e)` handlers.

Example:

```javascript
function doGet(e) {
  var worker = verifyWorkerRequest_(e);
  if (!worker.ok) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: worker.error }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // existing doGet logic
}
```

## Rollout Strategy

1. Set the same secret in:
   - Worker: `ADMIN_BACKEND_SIGNING_SECRET`
   - Apps Script: `WORKER_SIGNING_SECRET`
2. Deploy the Apps Script with `verifyWorkerRequest_(e)` enabled.
3. Confirm Worker calls still succeed.
4. Only after verification is stable, consider removing the old passcode-only trust model.

## Important Note

This does **not** replace the longer-term recommendation to migrate admin results off Google Apps Script. It simply gives the current boundary a stronger request-authentication layer.
