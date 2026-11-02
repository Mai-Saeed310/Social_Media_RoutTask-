# Social Media API

A back-end for a social media application built with **Node.js, Express and TypeScript**.
Users can register and sign in securely, publish posts with images, comment and reply, 
like posts, mention other users, and receive **push notifications** (Firebase Cloud Messaging) when they are mentioned.

## Features
- **Authentication & security**
  - Sign up with email confirmation by OTP (OTP is hashed in Redis and expires after 2 minutes)
  - Resend OTP, forget password, reset password with OTP, and update password
  - Sign in with access token (1 hour) and refresh token (1 year); log out revokes the token
  - Account is blocked for 5 minutes after 5 failed sign-in attempts
  - Sign up with Google
  - Roles (`User` / `Admin`) with separate secrets and token prefixes
  - `helmet`, `cors`, rate limiting (100 requests per 15 minutes), and Zod request validation
- **Posts**
  - Create and update posts with text and multiple attachments (uploaded to AWS S3)
  - Privacy per post: `public`, `friends` or `only_me`, and allow or deny comments
  - Mention (tag) other users
  - Like / unlike a post
  - Get posts with pagination, with comments, or with comments and replies
- **Comments & replies**: comment on a post, or reply to a comment, with optional attachments and mentions
- **Push notifications**: mentioned users get a Firebase Cloud Messaging notification; each user's device tokens are stored in Redis
- **File storage**: upload, list, download, pre-signed URLs and delete files on AWS S3
- **GraphQL**: a small demo endpoint at `/graphql`

## Tech Stack

| Area | Technology |
| --- | --- |
| Server | Node.js, Express 5, TypeScript |
| Database | MongoDB with Mongoose |
| Cache / sessions | Redis |
| Auth | JSON Web Tokens, bcrypt, Google Auth Library |
| Storage | AWS S3, Multer |
| Notifications | Firebase Admin SDK (FCM) |
| Email | Nodemailer |
| Validation | Zod |
| API | REST and GraphQL (`graphql-http`) |
| Security | Helmet, CORS, express-rate-limit |

## Project Structure

```
├── src/
│   ├── index.ts                  # entry point
│   ├── app.controller.ts         # Express app setup, routes, GraphQL
│   ├── config/config.service.ts  # environment variables
│   ├── models/                   # Mongoose models (user, post, comment)
│   ├── DB/                       # MongoDB connection and repositories
│   ├── modules/
│   │   ├── auth/                 # sign up / sign in / password / files
│   │   ├── posts/                # posts
│   │   └── comments/             # comments and replies
│   └── common/                   # middleware, enums, services (S3, Redis, notifications), email, security
├── Application_FCM_FE/           # small web page to get an FCM token (for testing notifications)
└── dist/                         # compiled JavaScript
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB and Redis
- An AWS S3 bucket, a Gmail/SMTP account, a Google OAuth client ID, and a Firebase project (for the related features)

### Installation

```bash
git clone https://github.com/Mai-Saeed310/Social_Media_RoutTask-.git
cd Social_Media_RoutTask-
npm install
```

### Environment variables

Create `.env.development` in the project root (use `.env.production` when `NODE_ENV=production`):

```env
PORT=3000

# Database & cache
DB_URI=mongodb://localhost:27017/social-media
REDIS_URL=redis://localhost:6379

# Auth
SALT_ROUNDS=10
PREFIX_USER=user
PREFIX_ADMIN=admin
ACCESS_SECRET_KEY_USER=your_user_access_secret
REFRESH_SECRET_KEY_USER=your_user_refresh_secret
ACCESS_SECRET_KEY_ADMIN=your_admin_access_secret
REFRESH_SECRET_KEY_ADMIN=your_admin_refresh_secret
CLIENT_ID=your_google_oauth_client_id

# Email (OTP)
EMAIL=your_email@gmail.com
PASSWORD=your_email_app_password

# AWS S3
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket
AWS_ACCESS_KEY=your_access_key
AWS_ACCESS_SECRET_KEY=your_secret_key
```

### Firebase service account

Push notifications use the Firebase Admin SDK. Download a service account key from your Firebase project and place the JSON file in `src/config/`. The notification service loads it by file name, so update the name in `src/common/service/notification.service.ts` to match your file. The server will not start without this file.

> Never commit `.env` files or service account keys.

### Run the project

```bash
# development (compiles with tsc in watch mode and restarts on changes)
npm run start:dev

# production mode
npm run start:prod
```

The server runs on `http://localhost:3000` by default.

### Test push notifications (optional)

Serve the `Application_FCM_FE/Application_FCM_FE` folder with a static server (for example the VS Code **Live Server** extension), allow notifications in the browser, and copy the generated FCM token. Send it as the `fcm` field when signing in so the server can notify that device.

## Authentication

Protected endpoints expect the access token in the `Authorization` header, with the prefix defined in your `.env` (`PREFIX_USER` or `PREFIX_ADMIN`):

```
Authorization: <PREFIX> <access_token>
```

## API Endpoints

### Auth — `/auth`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/sign-up` | No | Register and send a confirmation OTP by email |
| POST | `/auth/confirm-email` | No | Confirm the email with the OTP |
| POST | `/auth/resend-otp` | No | Resend the OTP |
| POST | `/auth/sign-in` | No | Sign in (optional `fcm` device token) and receive tokens |
| POST | `/auth/signup/gmail` | No | Sign up with a Google account |
| POST | `/auth/forgetPassword` | No | Send a password-reset OTP |
| POST | `/auth/resetPasswordOtp` | No | Reset the password using the OTP |
| POST | `/auth/updatePassword` | Yes | Change the password |
| POST | `/auth/logOut` | Yes | Log out and revoke the token |
| GET | `/auth/profile` | Yes (User) | Get the current profile |

### Posts — `/post`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/post/create` | Yes | Create a post (`content`, `attachments`, `tags`, `availability`, `allowComment`) |
| PATCH | `/post/update-post/:postId` | Yes | Update your post and its attachments |
| PATCH | `/post/like-post/:postId` | Yes | Like or unlike a post |
| GET | `/post/get` | Yes | Get posts visible to you |
| GET | `/post/get-paginate?page=&limit=` | Yes | Get posts with pagination |
| GET | `/post/get-with-comments` | Yes | Get posts with their comments |
| GET | `/post/get-with-comments-and-replies` | Yes | Get posts with comments and replies |

### Comments

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/post/:postId/comment/create` | Yes | Comment on a post |
| POST | `/post/:postId/comment/:commentId/reply/create` | Yes | Reply to a comment |

### Files (AWS S3) — `/auth`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/upload` | No | Upload a single image (field `attachment`) |
| POST | `/auth/upload-large` | Yes | Upload a large file from disk (field `attachment`) |
| POST | `/auth/upload-files` | Yes | Upload multiple files (field `attachments`) |
| POST | `/auth/upload-url` | Yes | Create a pre-signed upload URL |
| GET | `/auth/get-file/*path` | No | Get a file |
| GET | `/auth/get-files` | No | List files |
| GET | `/auth/pre-signed/*path` | No | Get a pre-signed download URL |
| DELETE | `/auth/delete` | No | Delete a file |
| DELETE | `/auth/deleteFiles` | No | Delete multiple files |
| DELETE | `/auth/deleteFolder` | No | Delete a folder |

### GraphQL — `/graphql`

A demo schema with the queries `hi` and `hello`, and a `createUser` mutation.

## Data Models

- **User**: name, email, password (hashed), age, phone, address, gender, role, provider (`System` / `Google`), profile picture, confirmed flag, and friends.
- **Post**: content, attachments, creator, tags, likes, `availability` (`public` / `friends` / `only_me`), and `allowComment` (`allow` / `deny`).
- **Comment**: content, attachments, creator, tags, likes, and a reference to the post or to the parent comment (replies).

## Author

**Mai Saeed** — [@Mai-Saeed310](https://github.com/Mai-Saeed310)

## License

ISC
