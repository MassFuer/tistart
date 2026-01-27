# Deployment Configuration Guide

## Backend (Render)
**URL**: https://tistart.onrender.com

### Environment Variables
You must set these in the Render Dashboard (Settings > Environment):

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Optimizes for production |
| `PORT` | `10000` | Standard Render port |
| `CLIENT_URL` | `https://tistart.netlify.app` | **CRITICAL**: The link sent in emails will point here. |
| `MONGODB_URI` | `(Your Mongo Atlas URI)` | Database connection string. Ensure it ends with `/nemesis` (e.g. `...mongodb.net/nemesis?retry...`) |
| `TOKEN_SECRET` | `(Your Secret)` | JWT Signing Secret |
| `EMAIL_USER` | `maxime.ducamp@gmail.com` | Gmail address |
| `EMAIL_PASS` | `(Your App Password)` | **NOT** your login password. Use an [App Password](https://myaccount.google.com/apppasswords). **REMOVE ALL SPACES**. |
| `CLOUDINARY_...` | `...` | Cloudinary credentials |
| `R2_...` | `...` | R2 Storage credentials |
| `STRIPE_...` | `...` | Stripe credentials |

---

## Frontend (Netlify)
**URL**: https://tistart.netlify.app

### Environment Variables
You must set these in the Netlify Dashboard (Site configuration > Environment variables):

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://tistart.onrender.com` | **CRITICAL**: Tells frontend where to send API requests. NO trailing slash. |
| `VITE_STRIPE_PUBLIC_KEY` | `pk_test_...` | Stripe Public Key |

## Troubleshooting Email
If emails are not arriving:
1. Check Cloud Logs (Render) for `"Nodemailer error"`.
2. Verify `EMAIL_PASS` is a valid App Password (16 chars) and has **no spaces**.
3. Ensure `CLIENT_URL` does NOT have a trailing slash (e.g. `https://tistart.netlify.app`, NOT `.../`).
