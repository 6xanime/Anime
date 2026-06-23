# Security Specification: Anime & Donghua Streaming App

This document outlines the strict security architectural bounds, database invariants, and adversarial "Dirty Dozen" payloads designed to test our zero-trust Attribute-Based Access Control (ABAC) in Google Cloud Firestore.

## 1. Core Data Invariants & Security Boundaries

1. **Relational Sync (Master Gate)**:
   * Episodes are sub-resources nested inside their parent Media documents: `/media/{mediaId}/episodes/{episodeId}`.
   * Access to create/update/delete an Episode is restricted to administrative identities stored in `/admins/{adminId}`.
   
2. **Double-Ended Identity Integrity**:
   * A user can only read, write, or update their own user profiles stored at `/profiles/{userId}` (where `{userId}` matches `request.auth.uid`).
   * No user can read or modify another user's profile (`/profiles/*` is private).
   * PII within user profiles (e.g., `email`) satisfies strict isolation and is only readable by the owner or a validated admin.

3. **Immutable Auditing**:
   * The `createdAt` and `joinDate` fields represent the absolute moment of record creation and must match `request.time`. They can never be mutated.

4. **Status & Privilege Hardening**:
   * Normal users cannot declare themselves as Admins or elevate their role. Administrative rights must be queried directly from `/admins/$(request.auth.uid)` in the authorized path, preventing self-assigned custom claims.
   * Users cannot modify administrative flags like `isBanned` on their own profile records. Only admins can perform user moderation.

---

## 2. The "Dirty Dozen" Threat Payloads
Below are 12 specific payloads or operations designed to violate identity, integrity, and state, which MUST return `PERMISSION_DENIED`.

### Payload 1: Anonymous Create Media (Unauthenticated Write)
* **Path**: `/media/malicious-item`
* **User**: Unauthenticated
* **Attack**: Adding a rogue anime listing to hijack client traffic.
* **Payload**:
```json
{
  "type": "anime",
  "title": "Hacked Show",
  "description": "Rogue injection",
  "genres": ["Action"],
  "studio": "Hacks",
  "status": "Ongoing",
  "releaseDate": "2026-06-11",
  "episodesCount": 12,
  "duration": "24m",
  "rating": 10.0,
  "views": 0,
  "popularityRank": 1,
  "posterUrl": "http://evil.com/poster.jpg",
  "bannerUrl": "http://evil.com/banner.jpg",
  "cast": []
}
```

### Payload 2: Normal Authenticated User Create Media (Privilege Escalation)
* **Path**: `/media/normal-user-show`
* **User**: Authenticated (`uid: "normal_user"`, verified email, non-admin)
* **Attack**: Standard user trying to act as administrator to list random contents.
* **Payload**: (Same as above)

### Payload 3: Spoofed Profile Creation (Identity Hijacking)
* **Path**: `/profiles/target_user_uid`
* **User**: Authenticated (`uid: "attacker_uid"`)
* **Attack**: Creating or overwriting another user's profile to inspect watchlists or corrupt high-scoring badges.
* **Payload**:
```json
{
  "email": "hijacked@example.com",
  "displayName": "Hijacked User",
  "avatarUrl": "https://images.unsplash.com/photo-1535713875002",
  "joinDate": "2026-01-01",
  "watchlist": [],
  "likes": [],
  "ratings": {},
  "badges": ["Hacked"],
  "achievements": []
}
```

### Payload 4: Self-Assigned Unbanning (Privilege Bypass)
* **Path**: `/profiles/banned_user_uid`
* **User**: Authenticated (`uid: "banned_user_uid"`)
* **Attack**: Overwriting the profile record to remove `isBanned` or manually claim elite user badges.
* **Payload**:
```json
{
  "email": "banned@example.com",
  "displayName": "Unbanned Me",
  "avatarUrl": "https://images.unsplash.com/photo-1535713875002",
  "joinDate": "2026-06-11",
  "watchlist": [],
  "likes": [],
  "ratings": {},
  "badges": ["Legendary Otaku", "Site Owner"],
  "isBanned": false,
  "achievements": []
}
```

### Payload 5: Comment Identity Impersonation (Spoofing Author ID)
* **Path**: `/comments/malicious-comment`
* **User**: Authenticated (`uid: "attacker_uid"`)
* **Attack**: Creating a comment under an arbitrary, popular username to spread spam or fake news.
* **Payload**:
```json
{
  "mediaId": "anime-1",
  "userName": "OfficialAdminApprovedName",
  "userAvatar": "https://images.unsplash.com/photo-1535",
  "text": "Go to scam-site.com to win an iPhone!",
  "likes": 0,
  "likedBy": [],
  "createdAt": "2026-06-11T01:43:08Z"
}
```

### Payload 6: Mutating Immutable Comment Audit-Trail (Field Corruption)
* **Path**: `/comments/existing-comment`
* **User**: Authenticated (`uid: "comment_owner_uid"`)
* **Attack**: Overwriting `createdAt` or initial `mediaId` to re-attribute comments or corrupt timestamps.
* **Payload**:
```json
{
  "mediaId": "anime-different",
  "userName": "VerifiedUser",
  "userAvatar": "https://images.unsplash.com/photo-1535",
  "text": "Tweaked text",
  "likes": 0,
  "likedBy": [],
  "createdAt": "2020-01-01T00:00:00Z"
}
```

### Payload 7: Direct Rating and Like Poisoning (Spam Manipulation)
* **Path**: `/comments/existing-comment`
* **User**: Authenticated (`uid: "malicious_user"`)
* **Attack**: Artificially incrementing total likes count directly without batch validations.
* **Payload**:
```json
{
  "likes": 999999
}
```

### Payload 8: Resource Poisoning (Denial of Wallet Word Bomb)
* **Path**: `/comments/bomber-comment`
* **User**: Authenticated (`uid: "spammer_uid"`)
* **Attack**: Injecting an excessively large string (>50KB text or random binary payload) to exhaust client resources and raise Firebase download bills.
* **Payload**:
```json
{
  "mediaId": "anime-1",
  "userName": "Spammer",
  "userAvatar": "https://images.unsplash.com/photo-1535",
  "text": "[...Over 100,000 Repeated Characters ...]",
  "likes": 0,
  "likedBy": [],
  "createdAt": "2026-06-11T01:43:08Z"
}
```

### Payload 9: Hijacking Sibling Sub-Resources (Orphaned Episode Injection)
* **Path**: `/media/unknown-show-id/episodes/rogue-episode`
* **User**: Unauthenticated or Standard User
* **Attack**: Direct write injection of a pirate host video embed code under active lists.
* **Payload**:
```json
{
  "mediaId": "unknown-show-id",
  "episodeNumber": 999,
  "title": "Malicious Redirection",
  "thumbnail": "http://evil.com/thumbnail.png",
  "videoUrl": "https://www.dailymotion.com/embed/video/x8nc8t7",
  "duration": "100m"
}
```

### Payload 10: Injecting Malicious System Announcements
* **Path**: `/notifications/notif-evil`
* **User**: Authenticated (`uid: "normal_user"`)
* **Attack**: Publishing app-wide high-priority push notifications pointing to external phishing domains.
* **Payload**:
```json
{
  "title": "URGENT SECURITY UPDATE!",
  "message": "Please secure your passwords at http://phishing.com",
  "type": "announcement",
  "createdAt": "2026-06-11T01:43:08Z",
  "read": false
}
```

### Payload 11: Direct Admin Registry Injection (Self-Created Superuser)
* **Path**: `/admins/attacker_uid`
* **User**: Authenticated (`uid: "attacker_uid"`)
* **Attack**: Direct write into the administrative lookup index to bootstrap superuser features without secondary approval.
* **Payload**:
```json
{
  "email": "attacker@scam.com",
  "role": "Super Admin"
}
```

### Payload 12: Corrupting Alternative IDs and Studio Names
* **Path**: `/media/anime-1`
* **User**: Authenticated (`uid: "normal_user_trying_to_modify"`)
* **Attack**: Tampering with existing validated lists to mock authors, delete studios, or spoof alt names.
* **Payload**:
```json
{
  "studio": "Hacked Studio",
  "author": "Hacked Author"
}
```

---

## 3. Test Verification Suites

These specifications dictate that security rules are mathematically tested against any mutation. In Phase 2, these rules will be formulated under `firestore.rules` and tested using automated lint runs.
